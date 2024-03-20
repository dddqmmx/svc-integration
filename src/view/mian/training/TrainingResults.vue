<script>
import {ipcRenderer} from "electron";
export default {
  data() {
    return {
      result:{},
      modelList:[],
      config:{},
      weight:"",
      weightName:'',
      type:"so-vits-svc-4.1"
    };
  },
  created() {
    ipcRenderer.send('get-training-result')
    const trainingResultListener = (event, result) => {
      this.result = result;
      console.log(result)
      ipcRenderer.off('training-result', trainingResultListener);
    };
    ipcRenderer.on('training-result', trainingResultListener);
    ipcRenderer.send('get-config');
    const getConfigListener = (event, config) => {
      this.config = config;
      console.log(config)
      this.getModelList();
      ipcRenderer.off('config', getConfigListener);
    };
    ipcRenderer.on('config', getConfigListener);
  },
  methods: {
    getFileType:function (fileType,fileName){
      switch(fileType){
        case "config":
          return {name:"config.json",path:fileName};
        case "main":
          return {name:"G.pth",path:fileName};
        case "diffusion":
          return {name:"diffusion.pt",path:'diffusion/'+fileName};
        case "diffusion_config":
          return {name:"diffusionConfig.yaml",path:'diffusion/'+fileName};
        case "clustering":
          return {name:"kmeans.pt",path:fileName};
        case "feature_retrieval":
          return {name:"feature_and_index.pkl",path:fileName};
        default:
          return {};
      }
    },
    updateFile:function (typeFile,fileName) {
      if (this.weight!=='新建'){
        this.weightName = this.weight;
      }
      const nameAndPath = this.getFileType(typeFile,fileName)
      const cpSuccess = () => {
        alert("更新")
        ipcRenderer.off("cp-success",cpSuccess);
      }
      ipcRenderer.send('cp',[{name:nameAndPath.name,path:this.config.workingDirectory+'/program/so-vits-svc/logs/44k/'+nameAndPath.path}],this.config.workingDirectory+'/weights/so-vits-svc-4.1/'+this.weightName);
      ipcRenderer.on("cp-success",cpSuccess)
    },
    getModelList:function () {
      const getFilesAndFoldersNamesListener = (event, items) => {
        this.modelList = items
        ipcRenderer.off("files-and-folders-names", getFilesAndFoldersNamesListener);
      };
      ipcRenderer.send('get-files-and-folders-names', this.config.workingDirectory + '/weights/'+this.type, 'folder');
      ipcRenderer.on("files-and-folders-names", getFilesAndFoldersNamesListener);
    },
  }
}
</script>

<template>
  <div style="padding: 20px;">
    <div>
      <select v-model="type">
        <option>so-vits-svc-4.1</option>
      </select>
      <select v-model="weight">
        <option>新建</option>
        <option v-for="model in modelList" :key="model">
          {{model}}
        </option>
      </select>
      <div v-if="weight === '新建'">
        权重名称: <input v-model="weightName"/>
      </div>
    </div>
    <div style="
     background-color: #606068;
     color: white;
     padding: 10px;
     border-radius: 3px;">
      <div>
        <div style="display: flex; justify-content: space-between;">
          <span style="padding-right: 5px;">配置文件</span>
          <div v-if="result.config">
            <input disabled :value="result.config">
            <button @click="updateFile('config',result.config)">更新</button>
          </div>
          <div v-else>
            <p>无</p>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="padding-right: 5px;">主模型</span>
          <div v-if="result.main">
            <input disabled :value="result.main">
            <button @click="updateFile('main',result.main)">更新</button>
          </div>
          <div v-else>
            <p>无</p>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="padding-right: 5px;">扩散模型</span>
          <div v-if="result.diffusion">
            <input disabled :value="result.diffusion">
            <button @click="updateFile('diffusion',result.diffusion)">更新</button>
          </div>
          <div v-else>
            <p>无</p>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="padding-right: 5px;">扩散模型配置文件</span>
          <div v-if="result.diffusion_config">
            <input disabled :value="result.diffusion_config">
            <button @click="updateFile('diffusion_config',result.diffusion_config)">更新</button>
          </div>
          <div v-else>
            <p>无</p>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="padding-right: 5px;">聚类模型</span>
          <div v-if="result.clustering">
            <input disabled :value="result.clustering">
            <button @click="updateFile('clustering',result.clustering)">更新</button>
          </div>
          <div v-else>
            <p>无</p>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="padding-right: 5px;">特征检索</span>
          <div v-if="result.feature_retrieval">
            <input disabled :value="result.feature_retrieval">
            <button @click="updateFile('feature_retrieval',result.feature_retrieval)">更新</button>
          </div>
          <div v-else>
            <p>无</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
*{
  margin: 0;
  padding: 0;
}
</style>
