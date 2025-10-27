#!/bin/bash

# Run the admin store console migration
# Make sure DATABASE_URL is set in your .env.local file

echo "🚀 Running admin store console migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found in environment"
  echo "Please set it in .env.local"
  exit 1
fi

# Run the SQL file
sqlcmd -S $AZURE_SQL_SERVER -d $AZURE_SQL_DATABASE -U $AZURE_SQL_USER -P $AZURE_SQL_PASSWORD \
  -i db/admin-store-console.sql

echo "✅ Migration complete!"

