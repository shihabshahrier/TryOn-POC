#!/bin/bash
# Database management wrapper script for TryOn-POC

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}TryOn-POC Database Management${NC}"
echo "=============================="

# Check if database exists
if [ ! -f "tryon.db" ]; then
    echo -e "${YELLOW}Warning: tryon.db not found${NC}"
fi

# Function to run with confirmation
run_with_confirmation() {
    local command="$1"
    local description="$2"
    
    echo -e "\n${YELLOW}$description${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python3 format_database.py $command
        echo -e "${GREEN}✓ Complete${NC}"
    else
        echo -e "${RED}✗ Cancelled${NC}"
    fi
}

# Main menu
echo
echo "Select an option:"
echo "1) Show database statistics"
echo "2) Verify file paths"
echo "3) Fix filepath formats"
echo "4) Clean orphaned sessions"
echo "5) Create backup"
echo "6) Reset database (DESTRUCTIVE!)"
echo "7) Full maintenance (fix + clean + verify)"
echo "8) Exit"
echo

read -p "Enter choice (1-8): " choice

case $choice in
    1)
        echo -e "\n${BLUE}Database Statistics:${NC}"
        python3 format_database.py stats
        ;;
    2)
        echo -e "\n${BLUE}Verifying File Paths:${NC}"
        python3 format_database.py verify
        ;;
    3)
        run_with_confirmation "fix" "This will fix filepath formats in the database"
        ;;
    4)
        run_with_confirmation "clean" "This will clean orphaned sessions"
        ;;
    5)
        echo -e "\n${BLUE}Creating Backup:${NC}"
        python3 format_database.py backup
        echo -e "${GREEN}✓ Backup created${NC}"
        ;;
    6)
        echo -e "\n${RED}⚠️  WARNING: This will DELETE ALL DATA! ⚠️${NC}"
        run_with_confirmation "reset" "RESET the entire database"
        ;;
    7)
        echo -e "\n${BLUE}Running Full Maintenance:${NC}"
        echo "1. Creating backup..."
        python3 format_database.py backup
        echo "2. Fixing filepaths..."
        python3 format_database.py fix
        echo "3. Cleaning orphaned data..."
        python3 format_database.py clean
        echo "4. Verifying files..."
        python3 format_database.py verify
        echo "5. Final stats..."
        python3 format_database.py stats
        echo -e "${GREEN}✓ Full maintenance complete${NC}"
        ;;
    8)
        echo -e "${BLUE}Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac