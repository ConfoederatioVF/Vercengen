@echo off
echo Generating documentation...
call npx jsdoc -c jsdoc.json > docs/latest.log
echo Documentation generated successfully!
pause