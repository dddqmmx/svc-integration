<script>
import {ipcRenderer} from "electron";
import * as fs from "fs";
import * as path from "path";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "FileManagement",
  data: function () {
    return {
      config: {},
      diffusion: {},
      skipLoudnorm: false,
      speechEncoder: "vec768l12",
      volAug:false,
      f0Predictor:'rmvpe',
      useDiff:true,
      numProcesses:1,
      workingDirectory: "",
      pythonDirectory: "",
      datasetList: [],
      soVitsSVCDatasetList: [],
      selectedIndexDataset: -1,
      selectedNameDataset: "",
      selectedIndexModel: -1,
      selectedNameModel: "",
      normalStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#D4D4D4', // 修改此处
      },
      selectedStyle: {
        background: '#00aa00',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        borderRadius: '3px'
      },
    }
  },
  created: function () {
    ipcRenderer.send('get-config');
    const getConfigListener = (event, config) => {
      this.workingDirectory = config.workingDirectory;
      this.pythonDirectory = config.pythonDirectory;
      this.getDatasetList();
      this.getSoVitsSVCList();

      ipcRenderer.off('config', getConfigListener);


      ipcRenderer.send("get-json-file",this.workingDirectory+"/program/so-vits-svc/configs/config.json");
      const getJsonFileListener = (event, json) => {
        this.config = json;
        ipcRenderer.off('json-file', getJsonFileListener);
      };
      ipcRenderer.on('json-file', getJsonFileListener)
    };
    ipcRenderer.on('config', getConfigListener);
  },
  methods: {
    preprocessHubertF0:function () {
      let arg = ["preprocess_hubert_f0.py", "--f0_predictor", this.f0Predictor]
      if (this.useDiff) {
        arg = arg.concat(["--use_diff","--num_processes" ,this.numProcesses])
      }
      ipcRenderer.send("resample",arg);
      const resampleResult = () => {
        alert("生成 hubert 与 f0完成")
        ipcRenderer.off("resample-result", resampleResult);
      };
      ipcRenderer.on("resample-result",resampleResult)
    },
    preprocessFlistConfig: function (){
      let arg = ["preprocess_flist_config.py", "--speech_encoder", this.speechEncoder]
      if (this.volAug){
        arg = arg.push('--vol_aug')
      }
      ipcRenderer.send("resample",arg);
      const resampleResult = () => {
        alert("自动生成完成")
        ipcRenderer.off("resample-result", resampleResult);
      };
      ipcRenderer.on("resample-result",resampleResult)
    },
    resample: function (){
      this.removeFilesInDirectory(this.workingDirectory+'/program/so-vits-svc/dataset/44k')
      let arg = ["resample.py"]
      if (this.skipLoudnorm){
        arg = arg.push('--skip_loudnorm')
      }
      ipcRenderer.send("resample",arg);
      const resampleResult = () => {
        alert("重采样完成")
        ipcRenderer.off("resample-result", resampleResult);
      };
      ipcRenderer.on("resample-result",resampleResult)
    },
    removeFilesInDirectory: function (directoryPath) {
      if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file) => {
          const curPath = path.join(directoryPath, file);

          if (fs.lstatSync(curPath).isDirectory()) {
            // Recursive call for directories
            this.removeFilesInDirectory(curPath);

            // Remove the directory itself after its contents are deleted
            fs.rmdirSync(curPath);
          } else {
            // Delete file
            fs.unlinkSync(curPath);
          }
        });
      }
    },
    removeDirectoryRecursive : function (directoryPath) {
      if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file) => {
          const curPath = path.join(directoryPath, file);

          if (fs.lstatSync(curPath).isDirectory()) {
            // Recursive call for directories
            this.removeDirectoryRecursive(curPath);
          } else {
            // Delete file
            fs.unlinkSync(curPath);
          }
        });
        // Remove the directory itself
        fs.rmdirSync(directoryPath);
      }
    },
    getDatasetList:function (){
      ipcRenderer.send('getDatasetList');
      const getDatasetListListener = (event, datasetList) => {
        this.datasetList = datasetList;
        ipcRenderer.off('datasetList', getDatasetListListener);
      };
      ipcRenderer.on('datasetList', getDatasetListListener);
    },
    getSoVitsSVCList:function (){
      ipcRenderer.send('getSoVitsDatasetSVCList');
      const getSoVitsDatasetSVCListLististener = (event, soVitsSVCDatasetList) => {
        this.soVitsSVCDatasetList = soVitsSVCDatasetList;
        ipcRenderer.off('soVitsSVCDatasetList', getSoVitsDatasetSVCListLististener);
      };
      ipcRenderer.on('soVitsSVCDatasetList', getSoVitsDatasetSVCListLististener);
    },
    deleteDataset: function () {
      this.removeDirectoryRecursive(this.workingDirectory+'/program/so-vits-svc/dataset_raw/'+this.selectedNameModel)
      this.getSoVitsSVCList();
      alert("删除成功")
    },
    copyDataset: function () {
      const copySuccess = () => {
        alert("移动成功")
        this.getSoVitsSVCList();
        ipcRenderer.off("copy-success",copySuccess);
      }
      ipcRenderer.send('copy',[this.workingDirectory+'/dataset/'+this.selectedNameDataset],this.workingDirectory+'/program/so-vits-svc/dataset_raw/'+this.selectedNameDataset);
      ipcRenderer.on("copy-success",copySuccess)
    },
    selectItemDataset: function(index,name) {
      this.selectedIndexDataset = index; // 点击时更新选中的index
      if (this.selectedIndexModel !== -1){
        this.selectedIndexModel = -1;
      }
      this.selectedNameDataset = name;
    },
    selectItemModel: function(index,name) {
      this.selectedIndexModel = index; // 点击时更新选中的index
      if (this.selectedIndexDataset !== -1){
        this.selectedIndexDataset = -1;
      }
      this.selectedNameModel = name;
    },
    saveConfig: function () {

      const jsonString = JSON.stringify(this.config, null, 2);

      fs.writeFile(this.workingDirectory+"/program/so-vits-svc/configs/config.json", jsonString, 'utf-8', (err) => {
        if (err) {
          alert('保存文件时出错:'+ err);
        } else {
          alert('文件保存成功')
        }
      });
    }
  }
}
</script>

<template>
  <div style="
  background: #2C2A38;
  height: 100%;
  color: white">
    <div style=";overflow: auto;">
      <div style="padding: 20px; ">
        <p>数据集管理</p>
        <div style="display: flex; background-color: #606068;
      color: white;
      padding: 10px;
      margin-top: 10px;
      border-radius: 3px;">
          <div class="col-5" style="flex: 1; display: flex;">
            <div style="display: flex; flex-direction: column; flex: 1;">
              <p>数据集</p>
              <div style="background-color: #373542;
      color: white;
      padding: 10px;
      border-radius: 3px;
margin-top: 5px">
                <div @click="selectItemDataset(index,dataset)" v-for="(dataset,index) in datasetList" :key="dataset" :style="index === selectedIndexDataset ? selectedStyle : normalStyle">
                  <p>{{dataset}}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-2" style="display: flex; flex-direction: column; justify-content: center;padding: 10px">
            <button v-if="selectedIndexDataset !== -1" @click="copyDataset" class="button" style="        color: #adadad;
        background: #42424e;
            ">&gt;&gt;&gt;</button>
            <button v-if="selectedIndexModel !== -1"  @click="deleteDataset" class="button" style="
            color: #adadad;
            background: #42424e;">&times;</button>
          </div>
          <div class="col-5" style="flex: 1; display: flex; ">
            <div style="display: flex; flex-direction: column; flex: 1;">
              <p>so-vits-svc文件夹</p>
              <div style="background-color: #373542;
      color: white;
      padding: 10px;
      border-radius: 3px;
margin-top: 5px">
                <div @click="selectItemModel(index,soVitsSVCDataset)" v-for="(soVitsSVCDataset,index) in soVitsSVCDatasetList" :key="soVitsSVCDataset" :style="index === selectedIndexModel ? selectedStyle : normalStyle">
                  <p >{{soVitsSVCDataset}}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p style="      margin-top: 10px;">数据集处理</p>
        <div style="background-color: #606068;
      color: white;
      padding: 10px;
      margin-top: 10px;
      border-radius: 3px;">
          <div>
            <div style="padding-top: 5px;padding-bottom: 5px;border-bottom: 2px solid #554F4F;">
              <p>重采样至 44100Hz 单声道<button @click="resample">开始</button></p>
              skip_loudnorm:<input type="checkbox" v-bind="skipLoudnorm">
            </div>
            <div>
            </div>
            <div style="padding-top: 5px;padding-bottom: 5px;border-bottom: 2px solid #554F4F;">
              <p>自动划分训练集、验证集，以及自动生成配置文件              <button @click="preprocessFlistConfig">开始</button></p>
              speech_encoder:
              <select v-model="speechEncoder">
                <option>vec768l12</option>
                <option>vec256l9</option>
                <option>hubertsoft</option>
                <option>whisper-ppg</option>
                <option>whisper-ppg-large</option>
                <option>cnhubertlarge</option>
                <option>dphubert</option>
                <option>wavlmbase+</option>
              </select>
              <p>
                使用响度嵌入:
                <input type="checkbox" v-bind="volAug">
              </p>
            </div>
            <div style="padding-top: 5px;padding-bottom: 5px;">
              <p>生成 hubert 与 f0              <button @click="preprocessHubertF0">开始</button></p>
              f0_predictor
              <select v-model="f0Predictor">
                <option>crepe</option>
                <option>dio</option>
                <option>pm</option>
                <option>harvest</option>
                <option>rmvpe</option>
                <option>fcpe</option>
              </select>
              <p>浅扩散功能<input type="checkbox" v-model="useDiff"></p>
              <p v-if="useDiff">num_processes<input type="number" v-model="numProcesses"></p>
          </div>
          </div>
        </div>
        <p style="      margin-top: 10px;">config.json配置文件管理<button @click="saveConfig">保存修改</button></p>
        <div style="background-color: #606068;
      color: white;
      padding: 10px;
      margin-top: 10px;
      border-radius: 3px;">
          <div>
            <p>keep_ckpts：训练时保留最后几个模型，0为保留所有，默认只保留最后3个</p>
            <input v-if="this.config.train" v-model.number="this.config.train.keep_ckpts">
            <p>all_in_mem：加载所有数据集到内存中，某些平台的硬盘 IO 过于低下、同时内存容量 远大于 数据集体积时可以启用</p>
            <input v-if="this.config.train" v-model="this.config.train.all_in_mem">
            <p>batch_size：单次训练加载到 GPU 的数据量，调整到低于显存容量的大小即可</p>
            <input v-if="this.config.train" v-model.number="this.config.train.batch_size">
            <p>vocoder_name : 选择一种声码器，默认为nsf-hifigan.</p>
            <input v-if="this.config.train" v-model="this.config.model.vocoder_name">
          </div>
        </div>
<!--        <p style="      margin-top: 10px;">diffusion.yaml配置文件管理<button>保存修改</button></p>-->
<!--        <div style="background-color: #606068;-->
<!--      color: white;-->
<!--      padding: 10px;-->
<!--      margin-top: 10px;-->
<!--      border-radius: 3px;">-->
<!--          <div>-->
<!--            <p>keep_ckpts：训练时保留最后几个模型，0为保留所有，默认只保留最后3个</p>-->
<!--            <p>all_in_mem：加载所有数据集到内存中，某些平台的硬盘 IO 过于低下、同时内存容量 远大于 数据集体积时可以启用</p>-->
<!--            <p>batch_size：单次训练加载到 GPU 的数据量，调整到低于显存容量的大小即可</p>-->
<!--            <p>vocoder_name : 选择一种声码器，默认为nsf-hifigan.</p>-->
<!--          </div>-->
<!--        </div>-->
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
}
</style>
