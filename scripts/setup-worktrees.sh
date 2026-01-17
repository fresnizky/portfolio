#!/bin/bash
#
# Setup Worktrees para Orquestacion Multi-Sesion BMAD
#
# Uso: ./scripts/setup-worktrees.sh [num_dev_worktrees]
#
# Este script:
# 1. Crea worktrees para SM, Dev(s), y Review
# 2. Configura CLAUDE.md apropiado para cada rol
# 3. Crea symlinks al tablero de orquestacion
# 4. Prepara el entorno para trabajo paralelo
#

set -e

# Configuracion
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="$(basename "${PROJECT_ROOT}")"
WORKTREES_DIR="${PROJECT_ROOT}/../${PROJECT_NAME}-worktrees"
TEMPLATES_DIR="${PROJECT_ROOT}/templates/worktree-claude-md"
NUM_DEV_WORKTREES="${1:-2}"  # Default: 2 worktrees de desarrollo

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

echo ""
echo "=============================================="
echo "  BMAD Multi-Session Worktree Setup"
echo "=============================================="
echo ""

# Verificar que estamos en un repo git
if [ ! -d "${PROJECT_ROOT}/.git" ]; then
    log_error "No se encontro repositorio git en ${PROJECT_ROOT}"
    exit 1
fi

# Verificar templates
if [ ! -d "${TEMPLATES_DIR}" ]; then
    log_error "No se encontraron templates en ${TEMPLATES_DIR}"
    log_info "Asegurate de tener los templates CLAUDE.md creados"
    exit 1
fi

# Crear directorio de worktrees
log_step "Creando directorio de worktrees..."
mkdir -p "${WORKTREES_DIR}"
log_info "Directorio: ${WORKTREES_DIR}"

# Obtener branch actual como base
cd "${PROJECT_ROOT}"
MAIN_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")
CURRENT_BRANCH=$(git branch --show-current)

log_info "Branch base: ${MAIN_BRANCH}"
log_info "Branch actual: ${CURRENT_BRANCH}"

# Funcion para crear worktree
create_worktree() {
    local name=$1
    local role=$2
    local branch_name="worktree/${name}"
    local worktree_path="${WORKTREES_DIR}/${name}"

    echo ""
    log_step "Configurando worktree: ${name} (rol: ${role})"

    if [ -d "${worktree_path}" ]; then
        log_warn "Worktree ${name} ya existe, actualizando CLAUDE.md..."
    else
        # Crear branch si no existe
        if ! git rev-parse --verify "${branch_name}" >/dev/null 2>&1; then
            log_info "  Creando branch: ${branch_name}"
            git branch "${branch_name}" "${MAIN_BRANCH}"
        fi

        # Crear worktree
        log_info "  Creando worktree en: ${worktree_path}"
        git worktree add "${worktree_path}" "${branch_name}"
    fi

    # Configurar CLAUDE.md
    local template_file="${TEMPLATES_DIR}/${role}.claude.md"
    local base_claude="${PROJECT_ROOT}/CLAUDE.md"
    local target_claude="${worktree_path}/CLAUDE.md"

    if [ -f "${template_file}" ]; then
        if [ -f "${base_claude}" ]; then
            # Combinar CLAUDE.md base con template del rol
            log_info "  Combinando CLAUDE.md base + template ${role}"
            cat "${base_claude}" > "${target_claude}"
            echo "" >> "${target_claude}"
            echo "---" >> "${target_claude}"
            echo "" >> "${target_claude}"
            cat "${template_file}" >> "${target_claude}"
        else
            # Solo template
            log_info "  Copiando template ${role}"
            cp "${template_file}" "${target_claude}"
        fi
    else
        log_warn "  Template ${role}.claude.md no encontrado"
    fi

    # Crear directorio para orchestration y symlink
    local orch_dir="${PROJECT_ROOT}/_bmad-output/orchestration"
    local wt_bmad_output="${worktree_path}/_bmad-output"

    mkdir -p "${wt_bmad_output}"

    if [ -d "${orch_dir}" ]; then
        # Crear symlink al directorio de orquestacion
        if [ ! -L "${wt_bmad_output}/orchestration" ]; then
            ln -sf "${orch_dir}" "${wt_bmad_output}/orchestration"
            log_info "  Symlink a tablero de orquestacion creado"
        fi
    else
        log_info "  Directorio de orquestacion aun no existe (se creara con /orchestrate init)"
    fi

    log_info "  Worktree ${name} listo"
}

# Crear worktree SM (Scrum Master)
create_worktree "wt-sm" "sm"

# Crear worktrees de desarrollo
for i in $(seq 1 $NUM_DEV_WORKTREES); do
    create_worktree "wt-dev-${i}" "dev"
done

# Crear worktree de review
create_worktree "wt-review" "review"

# Crear directorio de orquestacion si no existe
ORCH_DIR="${PROJECT_ROOT}/_bmad-output/orchestration"
if [ ! -d "${ORCH_DIR}" ]; then
    log_step "Creando directorio de orquestacion..."
    mkdir -p "${ORCH_DIR}"
fi

# Verificar .gitignore
echo ""
log_step "Verificando .gitignore..."
GITIGNORE="${PROJECT_ROOT}/.gitignore"
if [ -f "${GITIGNORE}" ]; then
    if ! grep -q "_bmad-output/orchestration" "${GITIGNORE}" 2>/dev/null; then
        log_warn "Agrega '_bmad-output/orchestration/' a .gitignore"
        echo ""
        echo "  Ejecuta:"
        echo "  echo '_bmad-output/orchestration/' >> .gitignore"
        echo ""
    else
        log_info ".gitignore ya tiene la entrada de orchestration"
    fi
else
    log_warn "No existe .gitignore"
fi

# Listar worktrees
echo ""
log_step "Worktrees configurados:"
git worktree list

# Resumen final
echo ""
echo "=============================================="
echo "  Setup Completado"
echo "=============================================="
echo ""
echo "Worktrees creados en: ${WORKTREES_DIR}"
echo ""
echo "  wt-sm       - Scrum Master (preparar stories)"
for i in $(seq 1 $NUM_DEV_WORKTREES); do
    echo "  wt-dev-${i}    - Developer ${i}"
done
echo "  wt-review   - Code Review"
echo ""
echo "Proximos pasos:"
echo ""
echo "  1. Verifica que .gitignore incluya '_bmad-output/orchestration/'"
echo ""
echo "  2. Inicializa el tablero de orquestacion:"
echo "     cd ${PROJECT_ROOT}"
echo "     claude"
echo "     > /orchestrate init"
echo ""
echo "  3. Abre sesiones en cada worktree segun necesites:"
echo "     # Terminal SM"
echo "     cd ${WORKTREES_DIR}/wt-sm && claude"
echo ""
echo "     # Terminal Dev 1"
echo "     cd ${WORKTREES_DIR}/wt-dev-1 && claude"
echo ""
echo "     # Terminal Review"
echo "     cd ${WORKTREES_DIR}/wt-review && claude"
echo ""
echo "  4. En cada sesion, usa /orchestrate para coordinar:"
echo "     > /orchestrate status   # Ver estado"
echo "     > /orchestrate take X   # Tomar story"
echo "     > /orchestrate complete X  # Completar"
echo ""
