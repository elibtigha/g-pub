ECHO OFF
for /F "tokens=*" %%A in (repos.txt) do git clone https://github.com/elibtigha/%%A.git %%A
PAUSE


