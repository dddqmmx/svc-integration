<script>
import {ipcRenderer} from "electron";
import AdmZip from "adm-zip";
import opn from "opn";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "DatasetList",
  data: function () {
    return {
      optionsVisible: false,
      workingDirectory: "",
      pythonDirectory: "",
      datasetList:[],
      dataset:""
    }
  },
  created: function() {
    ipcRenderer.send('get-config');
    ipcRenderer.on('config', (event, config) => {
      this.workingDirectory = config.workingDirectory;
      this.pythonDirectory = config.pythonDirectory;
      this.getDatasetList();
    });
  },
  methods: {
    exportToFolder(){
      ipcRenderer.send('open-path-dialog');
      const selectedPathListener = (event,selectedPath) => {
        const zip = new AdmZip();
        zip.addLocalFolder(this.workingDirectory+"/dataset/"+this.dataset);
        zip.writeZip(selectedPath+"/"+this.dataset+".zip");
        alert("导出完成");
        ipcRenderer.off('selected-path', selectedPathListener);
      };
      ipcRenderer.on('selected-path', selectedPathListener);
    },
    openFolder(){
      opn(this.workingDirectory+"/dataset/"+this.dataset);
    },
    showOptions(dataset) {
      this.dataset = dataset;
      event.preventDefault(); // 防止默认的右键菜单弹出
      this.optionsVisible = true;
      // this.$nextTick(() => {
      //   const options = this.$el.querySelector(".options");
      //   if (options) {
      //     options.style.top = event.clientY + "px";
      //     options.style.left = event.clientX + "px";
      //     // 添加事件监听器以在其他地方单击时隐藏选项菜单
      //     document.addEventListener("click", this.hideOptions);
      //   }
      // });
      this.$nextTick(() => {
        console.log(typeof this.$el) // 如果不是 'object', 问题就在这里
        //const options = this.$el.querySelector(".options");
        const options = this.$refs.options;
        if (options) {
          options.style.top = event.clientY + "px";
          options.style.left = event.clientX + "px";
          document.addEventListener("click", this.hideOptions);
        }
      });
    },
    hideOptions() {
      this.optionsVisible = false;
      document.removeEventListener("click", this.hideOptions);
    },
    getDatasetList:function (){
      ipcRenderer.send('getDatasetList');
      const getDatasetListListener = (event, datasetList) => {
        this.datasetList = datasetList;
        console.log(datasetList)
        ipcRenderer.off('datasetList', getDatasetListListener);
      };
      ipcRenderer.on('datasetList', getDatasetListListener);
    },
  }
}

</script>

<template>
  <div v-if="optionsVisible" class="options" ref="options">
    <ul>
      <li @click="exportToFolder">导出</li>
      <li @click="openFolder">浏览</li>
    </ul>
  </div>
  <div style="padding: 20px; " v-if="datasetList">
     <div v-for="dataset in datasetList" :key="dataset" class="col-sm-12 col-md-6 col-lg-4 p-1" style="display: inline-block;">
       <div @contextmenu="showOptions(dataset)" class="col-12"
            style="background-color: #373542;
            display: inline-block;
            color: white;
            padding: 10px;
            border-radius: 3px;">
         <p>{{dataset}}</p>
       </div>
     </div>
  </div>
</template>

<style scoped>
p{
  padding: 0;
  margin: 0;
}
.container-fluid,
.container {
  padding-right: 0;
  padding-left: 0;
}

table {
  border-collapse: collapse; /* 合并边框 */
}

th, td {
  border: 1px solid white; /* 设置单元格的边框 */
  padding: 8px; /* 可选：添加一些内边距以改善外观 */
}

.row {
  margin-right: 0;
  margin-left: 0;
}
/* 滚动槽 */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
::-webkit-scrollbar-thumb {
  border-radius: 8px;
  background: #4D4D5A;
}
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
