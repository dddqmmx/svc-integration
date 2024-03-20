<script>
import {ipcRenderer} from "electron";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "ImportAudio",
  data:function () {
    return {
      dropFileList: [],
      datasetName: "",
      workingDirectory : "",
      pythonDirectory : "",
    }
  },
  created: function() {
    ipcRenderer.send('get-config');
    ipcRenderer.on('config', (event, config) => {
      this.workingDirectory = config.workingDirectory;
      this.pythonDirectory = config.pythonDirectory;
    });
  },
  methods:{

    onDrop(event) {
      event.preventDefault();
      this.dropFileList = event.dataTransfer.files;
    },
    upload(){
      // for (let dropFile of this.dropFileList) {
      //   console.log(dropFile.path)
      // }
      let fileList = [];
      for (let i = 0; i < this.dropFileList.length; i++){
        fileList[i]={name:this.dropFileList[i].name,path:this.dropFileList[i].path}
      }
      const cpSuccess = () => {
        alert("上传成功")
        ipcRenderer.off("cp-success",cpSuccess);
      }
      ipcRenderer.send('cp',fileList,this.workingDirectory+'/dataset/'+this.datasetName);
      ipcRenderer.on("cp-success",cpSuccess)
    }
  }
}
</script>

<template>
  <div class="container-fluid" style="
  background: #2C2A38;
  height: 100%;
  color: white">
      <div style=";overflow: auto;">
        <div style="padding: 20px; ">
            <div style="background-color: #606068;
      color: white;
      padding: 10px;
      border-radius: 3px;">
              <div>
                <span>数据集名称：</span>
                <input type="text" v-model="datasetName">
                <input type="button" @click="upload" value="上传">
              </div>
              <div
                  @dragover.prevent @drop="onDrop"
                  style="width: calc(100%);  height: 150px; margin-top: 10px; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 5px dashed white;">
                <p v-if="dropFileList.length === 0">将文件拖到此处</p>
                <p v-if="dropFileList.length !== 0">已选择{{dropFileList.length}}个文件</p>
                <img style="width: 50px; height: 50px;" src="bg-upload.svg">
              </div>
          </div>
        </div>
      </div>
  </div>
</template>

<style scoped>

</style>
