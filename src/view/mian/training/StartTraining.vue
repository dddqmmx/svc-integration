<script >
// eslint-disable-next-line vue/no-export-in-script-setup
import training from "@/view/mian/Training.vue";
import {ipcRenderer} from "electron";

export default {
  computed: {
    training() {
      return training
    }
  },
  data() {
    return {
      taskRunning: false,
      consoleOutputs: [], // 用于存储程序输出信息的数组
      isScrolledToBottom: true,
      workingDirectory: "",
      pythonDirectory: "",
      modelType: 1,
      useGPU: true,
    };
  },
  created: function () {
    const c = this;

    ipcRenderer.send('get-config');
    const getConfigListener = (event, config) => {
      this.workingDirectory = config.workingDirectory;
      this.pythonDirectory = config.pythonDirectory;
      ipcRenderer.off('config', getConfigListener);
    };
    ipcRenderer.on('config', getConfigListener);
    this.logListener = (event, data) => {
      c.addConsoleOutput(data)
    };
    ipcRenderer.on("log",this.logListener)
    this.taskStatusListener = (event, data) => {
      this.taskRunning=data;
    };
    ipcRenderer.on('task-status',this.taskStatusListener)
    ipcRenderer.send('get-task-status')
  },
  beforeUnmount() {
    ipcRenderer.off('log', this.logListener);
    ipcRenderer.off('task-status', this.taskStatusListener);
  },
  methods: {
    stopTraining() {
      ipcRenderer.send("kill-python-script")
    },
    startTraining() {
      this.consoleOutputs=[];
      if (this.modelType == 1){
        ipcRenderer.send('call-python-script-real-time-log',this.workingDirectory+"/program/so-vits-svc","train.py",['-c', 'configs/config.json', '-m' ,'44k']);
      }else if (this.modelType == 2) {
        ipcRenderer.send('call-python-script-real-time-log', this.workingDirectory + "/program/so-vits-svc", 'train_diff.py', ['-c', 'configs/diffusion.yaml'])
      }else if (this.modelType == 3){
        ipcRenderer.send('call-python-script-real-time-log', this.workingDirectory + "/program/so-vits-svc", 'cluster/train_cluster.py', this.useGPU ? ['--gpu'] : [])
      }else if (this.modelType == 4){
        ipcRenderer.send("call-python-script-real-time-log",this.workingDirectory+"/program/so-vits-svc",'train_index.py',['-c', 'configs/config.json'])
      }
    },
    handleScroll() {
      // 检查是否已滚动到底部
      const container = this.$refs.consoleContainer;
      this.isScrolledToBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
    },
    scrollToBottom() {
      // 如果已经滚动到底部，更新滚动位置
      if (this.isScrolledToBottom) {
        const container = this.$refs.consoleContainer;
        container.scrollTop = container.scrollHeight;
      }
    },
    addConsoleOutput(data){
      this.consoleOutputs.push(data)
      if (this.isScrolledToBottom) {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    }
  },
};
</script>

<template>
  <div style="
  background: #2C2A38;
  height: 100%;
  color: white">
    <div style=";overflow: auto;">
      <div style="padding: 20px; ">
        <p>模型选择：
          <select>
            <option>so-vits-svc</option>
          </select>
          <select v-model="this.modelType">
            <option value="1">主模型训练</option>
            <option value="2">扩散模型</option>
            <option value="3">聚类模型</option>
            <option value="4">特征检索</option>
          </select>
          <button v-if="!taskRunning" @click="startTraining">开始训练</button>
          <button v-if="taskRunning" @click="stopTraining">终止训练</button>
        </p>
        <p v-if="modelType == 3">GPU<input type="checkbox" v-model="useGPU"></p>
        <div>
          <div ref="consoleContainer" @scroll="handleScroll" style="display: flex; flex-direction: column; background-color: #606068; color: white; padding: 10px; margin-top: 10px; border-radius: 3px; overflow-y: auto; max-height: 300px;">
            <div>
              <!-- 使用 v-for 遍历输出的信息 -->
              <div v-for="(output, index) in consoleOutputs" :key="index" style="white-space: pre-wrap;">
                {{ output }}
              </div>
            </div>
          </div>
        </div>
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
