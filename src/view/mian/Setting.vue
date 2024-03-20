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
">
      <div>
        <h5 style="margin: 0;">设置</h5>
      </div>
    </div>

    <div style="padding: 20px;">
      <h6>环境</h6>
      <div style="
      background-color: #606068;
      color: white;
      padding: 10px;
      border-radius: 3px;">
        <div>
          <div style="display: flex; justify-content: space-between;">
            <span style="padding-right: 5px;">用户文件路径</span>
            <div>
            <input v-model="workingDirectory">
            <span @click="setPath('working')">select-&gt;</span>
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Python路径</span>
          <div>
            <input v-model="pythonDirectory">
            <span @click="setPath('python')">select-&gt;</span>
          </div>
        </div>
      </div>
<!--      <h6 style="margin-top: 10px;" >下载</h6>-->
<!--      <div style="-->
<!--      background-color: #606068;-->
<!--      color: white;-->
<!--      padding: 10px;-->
<!--      border-radius: 3px;">-->
<!--        <div style="display: flex; justify-content: space-between;">-->
<!--          <span>Download Source</span>-->
<!--          <select>-->
<!--            <option>Default(Github)</option>-->
<!--          </select>-->
<!--        </div>-->
<!--      </div>-->
<!--      <h6 style="margin-top: 10px;" >网易云音乐</h6>-->
<!--      <div style="-->
<!--      background-color: #606068;-->
<!--      color: white;-->
<!--      padding: 10px;-->
<!--      border-radius: 3px;">-->
<!--        <div style="display: flex; justify-content: space-between;">-->
<!--          <span>API地址</span>-->
<!--          <span>Edit-&gt;</span>-->
<!--        </div>-->
<!--        <div style="display: flex; justify-content: space-between;">-->
<!--          <span>手机号</span>-->
<!--          <span>Edit-&gt;</span>-->
<!--        </div>-->
<!--        <div style="display: flex; justify-content: space-between;">-->
<!--          <span>密码</span>-->
<!--          <span>Edit-&gt;</span>-->
<!--        </div>-->
<!--      </div>-->
<!--      <h6 style="margin-top: 10px;" >语言</h6>-->
<!--      <div style="-->
<!--      background-color: #606068;-->
<!--      color: white;-->
<!--      padding: 10px;-->
<!--      border-radius: 3px;">-->
<!--        <div>-->
<!--          <span>语言</span>-->
<!--          <select>-->
<!--            <option>system language</option>-->
<!--            <option>English</option>-->
<!--            <option>日本語</option>-->
<!--            <option>简体中文</option>-->
<!--          </select>-->
<!--        </div>-->
<!--      </div>-->
    </div>

  </div>
</template>

<script>
import {ipcRenderer} from "electron";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Setting",
  data:function () {
    return {
      workingDirectory : "",
      pythonDirectory : "",
      selectedPathListener : null
    }
  },
  created: function() {
    ipcRenderer.send('get-config');
    ipcRenderer.on('config', (event, config) => {
      this.workingDirectory = config.workingDirectory;
      this.pythonDirectory = config.pythonDirectory;
    });
  },
  methods: {
    setPath: function (type) {
      // Path could be 'working' or 'python'.
      if (this.selectedPathListener) {
        ipcRenderer.removeListener("selected-path", this.selectedPathListener);
      }
      this.selectedPathListener = (event, selectedPath) => {
        console.log('所选路径:', selectedPath);
        // Set the selected path according to the input `type`.
        if(type === 'working'){
          this.workingDirectory = selectedPath;
          ipcRenderer.send('set-working-directory', selectedPath);
        } else if(type === 'python'){
          this.pythonDirectory = selectedPath;
          ipcRenderer.send('set-python-directory', selectedPath);
        }

        ipcRenderer.removeListener("selected-path", this.selectedPathListener);
        this.selectedPathListener = null;
      };

      ipcRenderer.on('selected-path', this.selectedPathListener);
      ipcRenderer.send('open-path-dialog');
    },
  }
}
</script>

<style scoped>
.col-xs-1,
.col-sm-1,
.col-md-1,
.col-lg-1,
.col-xs-2,
.col-sm-2,
.col-md-2,
.col-lg-2,
.col-xs-3,
.col-sm-3,
.col-md-3,
.col-lg-3,
.col-xs-4,
.col-sm-4,
.col-md-4,
.col-lg-4,
.col-xs-5,
.col-sm-5,
.col-md-5,
.col-lg-5,
.col-xs-6,
.col-sm-6,
.col-md-6,
.col-lg-6,
.col-xs-7,
.col-sm-7,
.col-md-7,
.col-lg-7,
.col-xs-8,
.col-sm-8,
.col-md-8,
.col-lg-8,
.col-xs-9,
.col-sm-9,
.col-md-9,
.col-lg-9,
.col-xs-10,
.col-sm-10,
.col-md-10,
.col-lg-10,
.col-xs-11,
.col-sm-11,
.col-md-11,
.col-lg-11,
.col-xs-12,
.col-sm-12,
.col-md-12,
.col-lg-12,
.container-fluid,
.container {
  padding-right: 0;
  padding-left: 0;
}

.row {
  margin-right: 0;
  margin-left: 0;
}
</style>
