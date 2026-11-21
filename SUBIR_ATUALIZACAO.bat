@echo off
chcp 65001 >nul
cd /d "%~dp0"
if exist ".git\index.lock" del /f /q ".git\index.lock"
git add api/clients.js src/context/AuthProfileContext.tsx src/components/AuthModal.jsx src/pages/Admin/AdminDashboard.tsx src/pages/Home/Movie/VideoPlayer.jsx src/pages/Home/TV/VideoPlayer.jsx src/pages/Home/LiveTV/LiveTvPage.jsx src/pages/Home/Originals/OriginalsPage.jsx GERAR_APK_TVBOX.bat
git commit -m "fix(auth): enforce strict trial expiration lock across cloud sync and all video players"
git push origin main
echo ===================================================
echo   ATUALIZACAO ENVIADA COM SUCESSO PARA A VERCEL!
echo ===================================================
pause
