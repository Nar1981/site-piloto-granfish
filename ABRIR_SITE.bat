@echo off
cd /d "%~dp0"
start "" http://localhost:8080/catalogo.html
echo Servidor em http://localhost:8080/catalogo.html  (feche esta janela para parar)
python -m http.server 8080 --bind 127.0.0.1
if errorlevel 1 py -m http.server 8080 --bind 127.0.0.1
pause
