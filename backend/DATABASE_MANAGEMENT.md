# Database Management Script

This script provides utilities to format, reset, and manage the TryOn-POC database.

## Usage

```bash
python format_database.py [command] [options]
```

## Available Commands

### 1. Show Statistics
```bash
python format_database.py stats
```
Displays:
- Number of users, products, and try-on sessions
- Completed vs failed sessions
- Last activity timestamps

### 2. Verify File Paths
```bash
python format_database.py verify
```
Checks that all file paths in the database point to existing files:
- Product images
- Result images
- User photos

### 3. Fix File Path Format
```bash
python format_database.py fix
```
Fixes file paths to use relative paths from storage root:
- Removes `storage/` prefix from product filepaths
- Updates try-on session paths
- Automatically creates backup before changes

### 4. Clean Orphaned Sessions
```bash
python format_database.py clean
```
Removes try-on sessions that reference non-existent users or products:
- Automatically creates backup before changes

### 5. Create Backup
```bash
python format_database.py backup
```
Creates a timestamped backup of the current database.

### 6. Reset Database
```bash
python format_database.py reset
```
**⚠️ WARNING: This will delete all data!**
- Creates backup first
- Deletes existing database
- Creates fresh database with proper schema
- Requires confirmation

## Options

- `--db DATABASE_FILE`: Specify different database file (default: `tryon.db`)

## Examples

```bash
# Check current database status
python format_database.py stats

# Verify all files exist
python format_database.py verify

# Fix filepath formats (safe)
python format_database.py fix

# Clean up orphaned data (safe)
python format_database.py clean

# Create manual backup
python format_database.py backup

# Reset everything (destructive!)
python format_database.py reset

# Work with different database file
python format_database.py --db custom.db stats
```

## Safety Features

- Automatic backups are created before any destructive operations
- Reset command requires explicit confirmation
- All operations provide detailed output
- File path verification before modifications

## Backup Files

Backups are automatically created with format: `tryon.db.backup_YYYYMMDD_HHMMSS`

Example: `tryon.db.backup_20250919_235959`

## Typical Workflow

1. **Check current status:**
   ```bash
   python format_database.py stats
   python format_database.py verify
   ```

2. **Fix any issues:**
   ```bash
   python format_database.py fix
   python format_database.py clean
   ```

3. **For fresh start:**
   ```bash
   python format_database.py reset
   ```

This script is particularly useful when:
- Migrating between different path formats
- Cleaning up test data
- Troubleshooting file path issues
- Setting up development environments