'use strict'

import {app, BrowserWindow, dialog, ipcMain, protocol} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS3_DEVTOOLS} from 'electron-devtools-installer'

const isDevelopment = process.env.NODE_ENV !== 'production'
const fs = require('fs');
const path = require('path');
const appPath = app.getPath('exe');

const weightDirRootName = ["so-vits-svc-4.1","so-vits-svc-4.0","rvc","vits"];

ipcMain.on('get-files-and-folders-names', (event,directoryPath,options,filter) => {
  const items = getFilesAndFoldersNames(directoryPath, options,filter);
  event.reply('files-and-folders-names', items);
});

function getSoVitsSVCDatasetList(){
  return getFilesAndFoldersNames(config.workingDirectory + '/program/so-vits-svc/dataset_raw', "folder");
}

function getDatasetList(){
  return getFilesAndFoldersNames(config.workingDirectory + '/dataset/', "folder");
}

function getWeights(){
  const json = {};
  for (const index in  weightDirRootName){
    const files = getFilesAndFoldersNames(config.workingDirectory+'/weights/'+weightDirRootName[index],"folder");
    if (files.length > 0){
      json[weightDirRootName[index]] = files;
    }
  }
  return json;
}

function getFilesAndFoldersNames(directoryPath, options = 'all', filter = null) {
  try {
    const items = fs.readdirSync(directoryPath);
    const filteredItems = items.filter(item => {
      const itemPath = path.join(directoryPath, item);
      const isFile = fs.statSync(itemPath).isFile();
      const isDirectory = fs.statSync(itemPath).isDirectory();

      if (options === 'file' && isFile) {
        return !filter || (filter instanceof RegExp && filter.test(item));
      } else if (options === 'folder' && isDirectory) {
        return !filter || (filter instanceof RegExp && filter.test(item));
      } else if (options === 'all') {
        return !filter || (filter instanceof RegExp && filter.test(item));
      }

      return false;
    });

    return filteredItems;
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
}

ipcMain.on('getWeightList', (event) =>{
  event.reply("weightList",getWeights());
})

ipcMain.on('getSoVitsDatasetSVCList', (event) =>{
  event.reply("soVitsSVCDatasetList",getSoVitsSVCDatasetList());
})

ipcMain.on('getDatasetList', (event) =>{
  event.reply("datasetList",getDatasetList());
})

ipcMain.on('cp', (event, fileList, targetDirectory) => {
  let fileNameList = [];

  fileList.forEach((file, index) => {
    fileNameList[index] = file.name;

    const sourcePath = file.path;
    const destinationPath = path.join(targetDirectory, file.name);

    // Check if the destination directory exists, and create it if not
    const destinationDir = path.dirname(destinationPath);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    // Copy the file to the destination path
    fs.copyFileSync(sourcePath, destinationPath);
  });

  console.log(fileNameList);
  event.reply('cp-success', fileNameList);
});

function copyFileOrDirectory(source, destination) {
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    // If source is a directory, create destination directory if not exists
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    // Read the contents of the directory
    const files = fs.readdirSync(source);

    // Recursively copy each file/directory inside the source directory
    files.forEach((file) => {
      const sourcePath = path.join(source, file);
      const destinationPath = path.join(destination, file);

      copyFileOrDirectory(sourcePath, destinationPath);
    });
  } else {
    // If source is a file, copy the file to the destination
    fs.copyFileSync(source, destination);
  }
}

ipcMain.on('copy', (event, fileList, targetDirectory) => {
  let fileNameList = [];

  fileList.forEach((item) => {
    copyFileOrDirectory(item, targetDirectory);
  });

  console.log(fileNameList);
  event.reply('copy-success', fileNameList);
});


ipcMain.on("resample", async (event, arg) => {
  try {
    const result = await callPythonScript(config.workingDirectory+'/program/so-vits-svc', config.pythonDirectory+'/python.exe', arg);
    console.log('Python script executed:', result);
  } catch (error) {
    console.error('Error executing Python script:', error);
  }
  event.reply('resample-result');
});

ipcMain.on("audio-mixer", async (event, arg,outPath) => {
  try {
    const result = await callPythonScript(config.workingDirectory+'/program/utils/', config.pythonDirectory+'/python.exe', arg);
    console.log('Python script executed:', result);
  } catch (error) {
    console.error('Error executing Python script:', error);
  }
  event.reply('audio-mixer-result',outPath);
});


ipcMain.on("uvr5-inference", async (event, argList) => {
  argList = JSON.parse(argList);
  const results = [];
  console.log('123');
  for (const arg of argList) {
    console.log('456');
    try {
      const result = await callPythonScript(config.workingDirectory+'/program/uvr5-cli/', config.pythonDirectory+'/python.exe', arg);
      console.log('Python script executed:', result);
    } catch (error) {
      console.error('Error executing Python script:', error);
      results.push(null);
    }
  }

  event.reply('uvr5-inference-result');
});

ipcMain.on("so-vits-svc-inference", async (event, argList) => {
  argList = JSON.parse(argList);
  const results = [];

  for (const [index, arg] of argList.entries()) {
    try {
      const result = await callPythonScript(config.workingDirectory+'/program/so-vits-svc', config.pythonDirectory+'/python.exe', arg);
      console.log('Python script executed:', result);
      const latestFilePath = await findLatestFilePathInDirectory(config.workingDirectory+'/program/so-vits-svc/results');
      results.push(latestFilePath);
      event.reply('so-vits-svc-inference', latestFilePath, index);
    } catch (error) {
      console.error('Error executing Python script:', error);
      results.push(null);
    }
  }


  event.reply('so-vits-svc-inference', "over");
});




async function findLatestFilePathInDirectory(directoryPath) {
  try {
    const files = await fs.promises.readdir(directoryPath);

    if (files.length === 0) {
      return null; // 文件夹为空
    }

    let latestFile = null;
    let latestMtime = 0;

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.promises.stat(filePath);
      if (stats.mtimeMs > latestMtime) {
        latestFile = filePath;
        latestMtime = stats.mtimeMs;
      }
    }
    return latestFile; // 返回最新文件的路径字符串
  } catch (error) {
    console.error(`发生错误：${error}`);
    return null;
  }
}


ipcMain.on('call-python-script-real-time-log', (event, cwd,script,args) => {
  runPythonInNodeEnvAsync(cwd,config.pythonDirectory+'/python.exe' , script, args,event)
});



const { exec } = require('child_process');
// 正则表达式匹配文件名模式
const getMatchingFile = async (directoryPath, pattern) => {
  try {
    const readFiles = async () => {
      return await fs.promises.readdir(directoryPath);
    };

    const files = await readFiles();
    let maxNumber = -Infinity;
    let maxNumberedFile = null;

    files.forEach(file => {
      const match = file.match(pattern);
      if (match) {
        const number = parseInt(match[1]);
        if (number > maxNumber) {
          maxNumber = number;
          maxNumberedFile = file;
        }
      } else if (file === pattern) { // Directly match the file name
        maxNumberedFile = file;
      }
    });

    return maxNumberedFile;
  } catch (err) {
    console.error('Error reading directory:', err);
    return null;
  }
};
const doesFileExist = (filePath) => {
  try {
    // 使用 fs.statSync 获取文件的状态信息
    fs.statSync(filePath);
    // 如果没有抛出异常，说明文件存在
    return true;
  } catch (err) {
    // 如果抛出异常，说明文件不存在
    return false;
  }
};


ipcMain.on('get-training-result', async (event) => {
  const info = {};
  const logsPath = config.workingDirectory + '/program/so-vits-svc/logs/44k';

  info.main = await getMatchingFile(logsPath, /^G_(\d+)\.pth$/);
  if (doesFileExist(logsPath + '/feature_and_index.pkl')){
    info.feature_retrieval = 'feature_and_index.pkl'
  }
  if (doesFileExist(logsPath + '/kmeans_10000.pt')){
    info.clustering  = 'kmeans_10000.pt'
  }
  if (doesFileExist(logsPath + '/kmeans_10000.pt')){
    info.clustering  = 'kmeans_10000.pt'
  }
  if (doesFileExist(logsPath + '/config.json')){
    info.config  = 'config.json'
  }

  const diffusionPath = path.join(logsPath, 'diffusion');
  info.diffusion = await getMatchingFile(diffusionPath, /^model_(\d+)\.pt$/);
  if (doesFileExist(diffusionPath + '/config.yaml')){
    info.diffusion_config  = 'config.yaml'
  }

  console.log(info);
  event.reply('training-result', info);
});




ipcMain.on('getGPUInfoList', (event) => {
  exec('nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total,power.draw,clocks.sm,clocks.mem --format=csv,noheader', (err, stdout) => {
    if (err) {
      console.error(err);
      return;
    }

    // Split the output by line and trim whitespace
    const lines = stdout.trim().split('\n');

    let gpuInfoList = [];
    // Loop through each line to extract information
    lines.forEach(line => {
      const [name, utilization, memoryUsed, memoryTotal, powerDraw, gpuFrequency, memoryFrequency] = line.split(', ');
      const gpuInfo = {
        name: name,
        utilization: utilization,
        memoryUsed: memoryUsed,
        memoryTotal: memoryTotal,
        powerDraw: powerDraw,
        gpuFrequency: gpuFrequency,
        memoryFrequency: memoryFrequency
      }
      gpuInfoList.push(gpuInfo)
    });
    // console.log(gpuInfoList)
    event.reply('gpuInfoList',gpuInfoList)
  });
});

// Execute nvidia-smi command to get GPU information




const { spawn  } = require('child_process');
const treeKill = require('tree-kill');
// import {PythonShell} from 'python-shell';
const execa = require('execa');
let subprocess = null;

ipcMain.on('kill-python-script', (event) => {
  if (subprocess && !subprocess.killed) {
    treeKill(subprocess.pid);
    event.reply('task-status',false)
  }
});

ipcMain.on('get-task-status',(event)=>{
  event.reply('task-status',subprocess!=null && !subprocess.killed)
})

app.on('before-quit', () => {
  if (subprocess && !subprocess.killed) {
    treeKill(subprocess.pid);
  }
});


async function runPythonInNodeEnvAsync(cwd, py, script, args, event) {
  const options = {
    cwd: cwd, // 设置运行目录
    env: {
      ...process.env,
      PYTHONUNBUFFERED: 1 // 禁用 Python 缓冲输出
    }
  };
  try {
    subprocess = execa(py, [script, ...args], options);
    event.reply('task-status',true)

    subprocess.stdout.on('data', (data) => {
      // 将数据发送到渲染进程
      event.reply('log', data.toString());
    });

    subprocess.stderr.on('data', (data) => {
      // 将错误数据发送到渲染进程
      event.reply('log', data.toString());
    });

    subprocess.on('close', () => {
      // 发送一个结束信号到渲染进程
      event.reply('command-finished');
      event.reply('task-status',false)
    });

    // 等待命令执行完成
    await subprocess;

    console.log('Python script completed');
  }catch (error){
    console.error('Error running Python script:', error);
    subprocess = null;
    event.reply('task-status',false)
  }

}




function callPythonScript(cwd, py, args) {
  return new Promise((resolve, reject) => {
    const python = spawn(py, args, {
      cwd: cwd,
    });

    let stdoutData = '';
    let stderrData = '';

    python.stdout.on('data', (data) => {
      stdoutData += data;
    });

    python.stderr.on('data', (data) => {
      stderrData += data;
    });

    python.on('close', (code) => {
      if (code === 0) {
        resolve(stdoutData); // 成功时解决 Promise 并传递结果
      } else {
        reject(`Child process exited with code ${code}. Error: ${stderrData}`); // 失败时拒绝 Promise 并传递错误信息
      }
    });
  });
}


const configPath = path.join(appPath, '/../config.json');

function readConfigFile() {
  return readJsonFile(configPath);
}

function readJsonFile(path) {
  try {
    const data = fs.readFileSync(path, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log(error)
    // 如果配置文件不存在或读取失败，可以返回默认的配置对象
    return {};
  }
}

const config = readConfigFile();


function saveConfigFile(config) {
  saveJsonFile(configPath,config)
}

function saveJsonFile(path,content){
  try {
    fs.writeFileSync(path, JSON.stringify(content, null, 2));
    console.log('配置已保存');
    console.log(configPath)
  } catch (error) {
    console.error('保存配置失败:', error);
    console.log(configPath)
  }
}

ipcMain.on('get-json-file', (event,path) => {
  event.reply('json-file', readJsonFile(path));
});

// ...

ipcMain.on('get-config', (event) => {
  event.reply('config', config);
});

ipcMain.on('save-json-file', (event,path,json) => {
  saveJsonFile(path,json);
  event.reply('save-config-success');
});

ipcMain.on('set-working-directory', (event, path) => {
  config.workingDirectory = path;
  saveConfigFile(config);
});

ipcMain.on('set-python-directory', (event, path) => {
  config.pythonDirectory = path;
  saveConfigFile(config);
});


ipcMain.on('open-path-dialog', (event) => {
  const options = {
    properties: ['openDirectory'], // 选择目录
    title: '选择路径',
    // defaultPath: app.getPath('home'), // 设置默认打开路径
  };

  dialog.showOpenDialog(win, options)
      .then((result) => {
        if (!result.canceled && result.filePaths.length > 0) {
          const selectedPath = result.filePaths[0];
          event.reply('selected-path', selectedPath);
        }
      })
      .catch((err) => {
        console.error('打开路径选择对话框失败:', err);
      });
});

ipcMain.on('open-file-dialog', (event,filters) => {
  dialog.showOpenDialog({
    properties: ['openFile'], // 仅允许选择文件，而不是文件夹

    filters: filters,
  }).then(result => {
    if (!result.canceled) {
      // 用户选择了文件
      const filePath = result.filePaths[0]
      console.log('用户选择的文件路径:', filePath)
      // 在渲染进程中使用filePath进行其他操作
      event.reply('selected-file', filePath)
    }
  }).catch(err => {
    console.error(err)
  })
});




// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let win;

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({

    titleBarStyle: 'hidden',
    width: 850,
    height: 600,
    minWidth:850,
    minHeight:600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      // nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
  ipcMain.on('resize', (event, width, height) => {
    win.setSize(width, height);
  });
  ipcMain.on('resizeMin', (event, width, height) => {
    win.setMinimumSize(width, height)
  });
  ipcMain.on('center', () => {
    win.center();
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow();

})



// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
