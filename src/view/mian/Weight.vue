<template>
  <div class="container-fluid" style="
  background: #2C2A38;
  height: 100%;
  color: white">
    <div style="
  height: 80px;
  width: 100%;
  background: #2C2A38;
  padding: 15px;
  border-bottom: 1px solid #554F4F;
  display: flex;
  align-items: center;
  justify-content: space-between; /* 新增 */
">
      <div>
        <h5>权重</h5>
      </div>
      <div>
        <button style="color: #ff5f64;padding-left: 10px;padding-right: 10px" class="button" @click="importWeight">导入</button>
      </div>
    </div>
    <div style="max-height: calc(100% - 80px);overflow: auto;">
      <div v-if="optionsVisible" class="options">
        <!-- 这里放置选项菜单内容 -->
        <ul>
          <li @click="exportToFolder">导出</li>
          <li @click="openFolder">浏览</li>
        </ul>
      </div>
      <div style="padding: 20px; " v-if="weightList">
        <div v-for="(weights,key) in weightList" :key="weights">
          <h6>{{key}}</h6>
            <div v-if="weights && weights.length != 0">
            <div>
              <div v-for="weight in weights" :key="weight" class="col-sm-12 col-md-6 col-lg-4 p-1" style="display: inline-block;">
                <div @contextmenu="showOptions(key,weight)" class="col-12" style="background-color: #373542;
              display: inline-block;
      color: white;
      padding: 10px;
      border-radius: 3px;">
                  <p>{{weight}}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const opn = require('opn');
import {ipcRenderer} from "electron";
const AdmZip = require('adm-zip');
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Weight",
  data:function () {
    return {
      model : "",
      weight : "",
      weightList : {},
      config : {},
      optionsVisible: false
    }
  },
  created: function() {
    this.getWeightList();

    ipcRenderer.send('get-config');
    const getConfigListener = (event, config) => {
      this.config = config;
      ipcRenderer.off('config', getConfigListener);
    };

    ipcRenderer.on('config', getConfigListener);
  },
  methods:{
    exportToFolder(){
      ipcRenderer.send('open-path-dialog');
      const selectedPathListener = (event,selectedPath) => {
        const zip = new AdmZip();
        zip.addLocalFolder(this.config.workingDirectory+"/weights/"+this.model+"/"+this.weight);
        zip.addZipComment(this.model);
        zip.writeZip(selectedPath+"/"+this.weight+".zip");
        alert("导出完成");
        ipcRenderer.off('selected-path', selectedPathListener);
      };
      ipcRenderer.on('selected-path', selectedPathListener);
    },
    openFolder(){
      opn(this.config.workingDirectory+"/weights/"+this.model+"/"+this.weight);
    },
    showOptions(model,weight) {
      this.model = model;
      this.weight = weight;
      event.preventDefault(); // 防止默认的右键菜单弹出
      this.optionsVisible = true;
      this.$nextTick(() => {
        const options = this.$el.querySelector(".options");
        if (options) {
          options.style.top = event.clientY + "px";
          options.style.left = event.clientX + "px";
          // 添加事件监听器以在其他地方单击时隐藏选项菜单
          document.addEventListener("click", this.hideOptions);
        }
      });
    },
    hideOptions() {
      this.optionsVisible = false;
      document.removeEventListener("click", this.hideOptions);
    },
    getWeightList:function (){
      ipcRenderer.send('getWeightList');
      const getWeightListListener = (event, weightList) => {
        this.weightList = weightList;
        console.log(weightList)
        ipcRenderer.off('weightList', getWeightListListener);
      };
      ipcRenderer.on('weightList', getWeightListListener);
    },
    importWeight:function () {
      const filters = [
        { name: '权重文件', extensions: ['zip'] }, // 指定文件类型过滤器
      ]
      ipcRenderer.send('open-file-dialog',filters);
      const openFileListener = (event, filePath) => {
        const zip = new AdmZip(filePath);
        const zipComment = zip.getZipComment();
        const weightDirRootName = ["rvc","so-vits-svc-4.0","so-vits-svc-4.1","vits"];
        let flag = false;
        for (const index in weightDirRootName){
          if (weightDirRootName[index] == zipComment){
            zip.extractAllTo(this.config.workingDirectory+"/weights/"+weightDirRootName[index], true);
            alert("权重导入成功")
            this.getWeightList();
            flag=true;
            break;
          }
        }
        if (!flag){
          alert("这个文件不受支持,可以尝试更新软件。或者这个zip文件并不是该软件导出的")
        }
        ipcRenderer.off('selected-file', openFileListener);
      };
      ipcRenderer.on('selected-file', openFileListener);
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
}
.options {
  padding: 5px;
  position: absolute;
  background-color: #4e4e4e;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  z-index: 1;
  min-width: 120px;
  top: 0; /* 这里会在右键单击时设置正确的位置 */
  left: 0; /* 这里会在右键单击时设置正确的位置 */
}

.options ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.options li {
  padding: 8px 16px;
  cursor: pointer;
}

.options li:hover {
  background-color: #302a2a;
  border-radius: 5px;
}

</style>
