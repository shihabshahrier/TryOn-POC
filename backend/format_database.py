#!/usr/bin/env python3
"""
Database formatting and management script for TryOn-POC
This script provides utilities to format, reset, and migrate the database.
"""

import os
import sqlite3
import shutil
from pathlib import Path
from datetime import datetime
import argparse

def backup_database(db_path: str) -> str:
    """Create a backup of the current database"""
    if not os.path.exists(db_path):
        print(f"Database {db_path} does not exist, no backup needed")
        return ""
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{db_path}.backup_{timestamp}"
    shutil.copy2(db_path, backup_path)
    print(f"Database backed up to: {backup_path}")
    return backup_path

def reset_database(db_path: str):
    """Completely reset the database by deleting it"""
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Database {db_path} has been deleted")
    else:
        print(f"Database {db_path} does not exist")

def create_fresh_database():
    """Create a fresh database with proper schema"""
    from database import create_tables
    create_tables()
    print("Fresh database created with proper schema")

def fix_filepath_format(db_path: str):
    """Fix filepaths in the database to use relative paths from storage root"""
    if not os.path.exists(db_path):
        print(f"Database {db_path} does not exist")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Fix product filepaths
    cursor.execute("SELECT id, filepath FROM products")
    products = cursor.fetchall()
    
    updated_products = 0
    for product_id, filepath in products:
        if filepath.startswith('storage/'):
            # Remove 'storage/' prefix
            new_filepath = filepath[8:]  # Remove 'storage/' (8 characters)
            cursor.execute("UPDATE products SET filepath = ? WHERE id = ?", (new_filepath, product_id))
            updated_products += 1
            print(f"Updated product {product_id}: {filepath} -> {new_filepath}")
    
    # Fix try-on session filepaths
    cursor.execute("SELECT id, input_user_photo_path, input_product_photo_path, output_image_path FROM tryon_sessions")
    sessions = cursor.fetchall()
    
    updated_sessions = 0
    for session_id, user_path, product_path, output_path in sessions:
        updates = []
        new_user_path = user_path
        new_product_path = product_path
        new_output_path = output_path
        
        if user_path and user_path.startswith('storage/'):
            new_user_path = user_path[8:]
            updates.append(f"user_path: {user_path} -> {new_user_path}")
        
        if product_path and product_path.startswith('storage/'):
            new_product_path = product_path[8:]
            updates.append(f"product_path: {product_path} -> {new_product_path}")
        
        if output_path and output_path.startswith('storage/'):
            new_output_path = output_path[8:]
            updates.append(f"output_path: {output_path} -> {new_output_path}")
        
        if updates:
            cursor.execute("""
                UPDATE tryon_sessions 
                SET input_user_photo_path = ?, input_product_photo_path = ?, output_image_path = ? 
                WHERE id = ?
            """, (new_user_path, new_product_path, new_output_path, session_id))
            updated_sessions += 1
            print(f"Updated session {session_id}: {', '.join(updates)}")
    
    conn.commit()
    conn.close()
    
    print(f"Fixed {updated_products} product filepaths and {updated_sessions} session filepaths")

def clean_orphaned_sessions(db_path: str):
    """Clean up try-on sessions that reference non-existent users or products"""
    if not os.path.exists(db_path):
        print(f"Database {db_path} does not exist")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Find orphaned sessions
    cursor.execute("""
        SELECT ts.id, ts.user_id, ts.product_id 
        FROM tryon_sessions ts
        LEFT JOIN users u ON ts.user_id = u.id
        LEFT JOIN products p ON ts.product_id = p.id
        WHERE u.id IS NULL OR p.id IS NULL
    """)
    
    orphaned_sessions = cursor.fetchall()
    
    if orphaned_sessions:
        print(f"Found {len(orphaned_sessions)} orphaned sessions:")
        for session_id, user_id, product_id in orphaned_sessions:
            print(f"  Session {session_id}: user_id={user_id}, product_id={product_id}")
        
        cursor.execute("""
            DELETE FROM tryon_sessions 
            WHERE id IN (
                SELECT ts.id 
                FROM tryon_sessions ts
                LEFT JOIN users u ON ts.user_id = u.id
                LEFT JOIN products p ON ts.product_id = p.id
                WHERE u.id IS NULL OR p.id IS NULL
            )
        """)
        
        conn.commit()
        print(f"Deleted {len(orphaned_sessions)} orphaned sessions")
    else:
        print("No orphaned sessions found")
    
    conn.close()

def show_database_stats(db_path: str):
    """Show statistics about the database contents"""
    if not os.path.exists(db_path):
        print(f"Database {db_path} does not exist")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Count records in each table
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM products")
    product_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM tryon_sessions")
    session_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM tryon_sessions WHERE output_image_path IS NOT NULL")
    completed_sessions = cursor.fetchone()[0]
    
    print("\n=== Database Statistics ===")
    print(f"Users: {user_count}")
    print(f"Products: {product_count}")
    print(f"Try-on Sessions: {session_count}")
    print(f"Completed Sessions: {completed_sessions}")
    print(f"Failed Sessions: {session_count - completed_sessions}")
    
    # Show recent activity
    cursor.execute("SELECT created_at FROM users ORDER BY created_at DESC LIMIT 1")
    last_user = cursor.fetchone()
    if last_user:
        print(f"Last user created: {last_user[0]}")
    
    cursor.execute("SELECT created_at FROM products ORDER BY created_at DESC LIMIT 1")
    last_product = cursor.fetchone()
    if last_product:
        print(f"Last product created: {last_product[0]}")
    
    cursor.execute("SELECT created_at FROM tryon_sessions ORDER BY created_at DESC LIMIT 1")
    last_session = cursor.fetchone()
    if last_session:
        print(f"Last try-on session: {last_session[0]}")
    
    conn.close()

def verify_file_paths(db_path: str):
    """Verify that all file paths in the database point to existing files"""
    if not os.path.exists(db_path):
        print(f"Database {db_path} does not exist")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    storage_root = Path("./storage")
    
    print("\n=== Verifying File Paths ===")
    
    # Check product files
    cursor.execute("SELECT id, name, filepath FROM products")
    products = cursor.fetchall()
    
    missing_products = []
    for product_id, name, filepath in products:
        full_path = storage_root / filepath
        if not full_path.exists():
            missing_products.append((product_id, name, filepath))
    
    if missing_products:
        print(f"Missing product files ({len(missing_products)}):")
        for product_id, name, filepath in missing_products:
            print(f"  Product {product_id} ({name}): {filepath}")
    else:
        print(f"All {len(products)} product files exist")
    
    # Check session files
    cursor.execute("SELECT id, input_user_photo_path, output_image_path FROM tryon_sessions WHERE output_image_path IS NOT NULL")
    sessions = cursor.fetchall()
    
    missing_results = []
    for session_id, user_path, output_path in sessions:
        if output_path:
            full_path = storage_root / output_path
            if not full_path.exists():
                missing_results.append((session_id, output_path))
    
    if missing_results:
        print(f"Missing result files ({len(missing_results)}):")
        for session_id, output_path in missing_results:
            print(f"  Session {session_id}: {output_path}")
    else:
        print(f"All {len(sessions)} result files exist")
    
    conn.close()

def main():
    parser = argparse.ArgumentParser(description="Database formatting and management script")
    parser.add_argument("--db", default="tryon.db", help="Database file path (default: tryon.db)")
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Reset command
    subparsers.add_parser("reset", help="Reset database (delete and recreate)")
    
    # Fix command
    subparsers.add_parser("fix", help="Fix filepath formats in database")
    
    # Clean command
    subparsers.add_parser("clean", help="Clean orphaned sessions")
    
    # Stats command
    subparsers.add_parser("stats", help="Show database statistics")
    
    # Verify command
    subparsers.add_parser("verify", help="Verify file paths exist")
    
    # Backup command
    subparsers.add_parser("backup", help="Create database backup")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    db_path = args.db
    
    if args.command == "reset":
        confirm = input(f"Are you sure you want to reset the database '{db_path}'? (y/N): ")
        if confirm.lower() == 'y':
            backup_database(db_path)
            reset_database(db_path)
            create_fresh_database()
        else:
            print("Reset cancelled")
    
    elif args.command == "fix":
        backup_database(db_path)
        fix_filepath_format(db_path)
        print("Database filepaths have been fixed")
    
    elif args.command == "clean":
        backup_database(db_path)
        clean_orphaned_sessions(db_path)
    
    elif args.command == "stats":
        show_database_stats(db_path)
    
    elif args.command == "verify":
        verify_file_paths(db_path)
    
    elif args.command == "backup":
        backup_database(db_path)

if __name__ == "__main__":
    main()