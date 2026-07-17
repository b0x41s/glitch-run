@echo off
cd /d "%~dp0dist"
py -m http.server 8080
