**Development environment on Windows 10**

Windows WSL2 installation:

Followed the manual installations steps from:

https://docs.microsoft.com/en-us/windows/wsl/install-win10

In practice: 

PowerShell (as administrator)

```sh
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

Reboot.

Download and install: https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi

PowerShell (as administrator)

```sh
wsl --set-default-version 2
```

Browse to Ubuntu distribution for Windows: https://www.microsoft.com/store/apps/9n6svws3rx71

Open in "App Store", install, and it's done!

Install mongodb in the WSL environment:

```sh
sudo apt update
sudo apt-install mongodb
sudo mkdir /data
sudo mkdir /data/db
sudo chown  /data/db
sudo chgrp  /data/db
mongod # starts the mongodb, must be left open
```

Install node version manager (More details see: https://github.com/nvm-sh/nvm):

Open new Ubuntu shell:

```sh
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
```

Close shell and open new try:

```sh
nvm install 10 # there are newer, but this is well tested
```

Clone packages:

```sh
cd
mkdir work
cd work
https://github.com/akaustel/whadapp.git
```

Quite close to the finish line....

Install some tools:

```sh
npm install -g typescript nodemon ts-node
```

Frontend:

```sh
cd ~/work/whadapp/frontend
npm install
npm start # leave running
```

Backend:

```sh
cd ~/work/whadapp/backend
npm install
npm start # leave running
```

All done.

To open editor:

```sh
cd ~/work/whadapp
code .
```


