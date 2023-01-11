import {spawnProxy, ProviderProxy, OpenWebSocket} from "./providerProxy";
import path from "path";
import helpers from "./helpers";

const { executeKdf } = require("@cosmjs/proto-signing");

const appVersion = "1.0.0";//window.process.argv[window.process.argv.length - 2];
const appEnvironment = "development";//window.process.argv[window.process.argv.length - 1];

// whitelist channels
const validChannels = ["update_available", "update_downloaded", "download_update", "restart_app", "show_notification", "check_update", "relaunch"];
const defaultSaveDialogOptions = {
  dialogTitle: "Save",
  buttonLabel: "Save",
  filters: [{ name: "txt", extensions: ["txt"] }],
  properties: []
};

let logsWorker;
let downloadWorker;

const fork = (path, args, options) => {
  const worker = new Worker(path);
  worker.postMessage({ args, options });
  return worker;
}

spawnProxy();

window.electron = {
  queryProvider: (url, method, body, certPem, prvPem) => {/*spawnProxy();*/ return ProviderProxy(url, method, body, certPem, prvPem)},
  openWebSocket: async (url, certPem, prvPem, onMessage) => { return OpenWebSocket(url, certPem, prvPem, onMessage)},
  openUrl: (url) => {
    // console.log("Opening in browser: " + url);
    window.open(url);
  },
  getAppVersion: () => appVersion,
  getAppEnvironment: () => appEnvironment,
  isDev: () => "",//ipcRenderer.invoke("isDev"),
  appPath: (name) => "",//ipcRenderer.invoke("app_path", name),
  openTemplateFromFile: async () => {
    const response = "";
    return response;
    // await ipcRenderer.invoke("dialog", "showOpenDialog", {
    //   title: "Select a deployment template",
    //   filters: [{ name: "Deployment template", extensions: ["yml", "yaml", "txt"] }],
    //   properties: ["openFile"]
    // });
    // if (response.canceled) {
    //   return null;
    // } else {
    //   const path = response.filePaths[0];
    //   const buffer = await fs.readFile(path);
    //   const content = buffer.toString();

    //   return { path, content };
    // }
  },
  downloadLogs: async (appPath, url, certPem, prvPem, fileName) => {
    return new Promise((res, rej) => {

      logsWorker = fork(path.join(__dirname, "/workers/log.worker.js"), ["args"], {
        stdio: ["pipe", "pipe", "pipe", "ipc"]
      });

      function cleanup() {
        logsWorker.kill();
        // delete logsWorker;
      }

      logsWorker.on("error", (err) => {
        rej("Spawn failed! (" + err + ")");
        cleanup();
      });
      logsWorker.stderr.on("data", function (data) {
        rej(data);
        cleanup();
      });
      logsWorker.on("message", (data) => {
        res(data);
        cleanup();
      });

      logsWorker.send({ appPath, url, certPem, prvPem, fileName });
    });
  },
  cancelSaveLogs: async () => {
    logsWorker?.send("cleanup");

    await helpers.sleep(500);

    logsWorker?.kill();
    // delete logsWorker;

    // Throw error to interupt the flow of execution
    throw new Error("Cancelled export logs");
  },
  saveFileFromTemp: async (oldPath, defaultPath, options = defaultSaveDialogOptions) => {
    const response = "";
    return response;
    // await ipcRenderer.invoke("dialog", "showSaveDialog", {
    //   defaultPath,
    //   ...defaultSaveDialogOptions,
    //   ...options
    // });
    // if (response.canceled) {
    //   return null;
    // } else {
    //   const path = response.filePath;

    //   await fs.rename(oldPath, path);

    //   return path;
    // }
  },
  downloadFile: async (appPath, url, certPem, prvPem, fileName) => {
    return new Promise((res, rej) => {

      downloadWorker = fork(path.join(__dirname, "/workers/download.worker.js"), ["args"], {
        stdio: ["pipe", "pipe", "pipe", "ipc"]
      });

      function cleanup() {
        downloadWorker.kill();
        // delete downloadWorker;
      }

      downloadWorker.on("error", (err) => {
        rej("Spawn failed! (" + err + ")");
        cleanup();
      });
      downloadWorker.stderr.on("data", function (data) {
        rej(data);
        cleanup();
      });
      downloadWorker.on("message", (data) => {
        res(data);
        cleanup();
      });

      downloadWorker.send({ appPath, url, certPem, prvPem, fileName });
    });
  },
  cancelDownloadFile: async () => {
    downloadWorker?.send("cleanup");

    await helpers.sleep(500);

    downloadWorker?.kill();
    // delete downloadWorker;

    // Throw error to interupt the flow of execution
    throw new Error("Cancelled download file");
  },
  executeKdf: async (password, kdfConf) => {
    const key = await executeKdf(password, kdfConf);
    return (key);
    // return new Promise((res, rej) => {

    //   const myWorker = cp.fork(path.join(__dirname, "/workers/wallet.worker.js"), ["args"], {
    //     stdio: ["pipe", "pipe", "pipe", "ipc"]
    //   });

    //   myWorker.on("error", (err) => {
    //     rej("Spawn failed! (" + err + ")");
    //     myWorker.kill();
    //   });
    //   myWorker.stderr.on("data", function (data) {
    //     rej(data);
    //     myWorker.kill();
    //   });
    //   myWorker.on("message", (data) => {
    //     res(data);
    //     myWorker.kill();
    //   });

    //   myWorker.send({ password, kdfConf });
    // });
  },
  api: {
    send: (channel, data) => {
      if (validChannels.includes(channel)) {
        // ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        // ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    removeAllListeners: (channel) => {
      if (validChannels.includes(channel)) {
        // ipcRenderer.removeAllListeners(channel);
      }
    }
  }
}
// });
