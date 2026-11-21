@echo off
chcp 65001 >nul
echo ===================================================
echo   GERANDO APK CINE SPARTAN (COMPATIVEL TV BOX/TV)
echo ===================================================
cd /d "%~dp0"

echo [1/4] Compilando aplicacao Web (target Chrome 64 / TV Box)...
call npm.cmd run build
if errorlevel 1 (
    echo ERRO no build web!
    pause
    exit /b 1
)

echo [2/4] Sincronizando com projeto Android (Capacitor)...
call npx.cmd cap sync android
if errorlevel 1 (
    echo ERRO no cap sync!
    pause
    exit /b 1
)

echo [3/4] Compilando APK Android (Gradle assembleDebug)...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo ERRO na compilacao do APK!
    pause
    exit /b 1
)
cd ..

echo [4/4] Copiando APK para public\cinespartan.apk e cinespartan.apk...
copy /Y "%TEMP%\cinespartan-gradle-build\app\outputs\apk\debug\app-debug.apk" "public\cinespartan.apk"
copy /Y "%TEMP%\cinespartan-gradle-build\app\outputs\apk\debug\app-debug.apk" "cinespartan.apk"

echo ===================================================
echo   APK GERADO COM SUCESSO!
echo   Local: public\cinespartan.apk
echo ===================================================
pause
