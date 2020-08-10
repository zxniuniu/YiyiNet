call xcopy D:\Workspace\git\YiyiNet\release\win-unpacked\*.* %~dp0 /F /E /Y

call rmdir /S /Q %~dp0resources\app\
:: call mkdir %~dp0resources\app\
:: call asar e %~dp0resources\app.asar resources\app

:: call del /F /Q %~dp0resources\app.asar
:: call del /F /Q %~dp0resources\app\main.min.js

:: call copy D:\Workspace\git\YiyiNet\main.js %~dp0resources\app\main.js /Y

:: call rename %~dp0resources\app\main.js main.min.js

call YiyiNet.exe