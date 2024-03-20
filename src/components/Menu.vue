<template>
  <div style="border-bottom: 1px solid #2C2A38; position: relative;height: 100%">
    <div style="
      height: 80px;
      width: 100%;
      background: #42424E;
      border-bottom: 1px solid #554F4F;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    ">
      <h5 style="color: white; margin: 0;">svc-integration</h5>
      <h6 style="color: red; margin: 0; margin-top: 5px;">test version</h6>
    </div>

    <div v-for="(item, index) in dataList"
         :key="item.id"
         :style="index === selectedIndex ? selectedStyle : normalStyle"
         v-on:click="selectItem(index, item.router)">
      {{ item.text }}
    </div>
    <div style="position: absolute; bottom: 0; left: 0; right: 0; width: 100%; max-width: 800px; margin: 0 auto;text-align: center">
      <div style="color: white; font-size: 10px;">
        <div v-for="gpuInfo in gpuInfoList" :key="gpuInfo">
          <p style="color: white; font-size: 9px;">{{gpuInfo.name}}</p>
          <p>显卡占用率: {{gpuInfo.utilization}}</p>
          <p>显存占用: {{gpuInfo.memoryUsed}}/{{gpuInfo.memoryTotal}}</p>
          <p>功耗: {{gpuInfo.powerDraw}}</p>
          <p>显卡频率: {{gpuInfo.gpuFrequency}}</p>
          <p>显存频率: {{gpuInfo.memoryFrequency}}</p>
        </div>
      </div>
      <div style="color: white;margin: 10px;font-size: 12px">
        <span v-if="!taskRunning">
          <div style="display: inline-block;height: 12px; width: 12px; background: #41b883; border-radius: 50%;"></div>
        未运行任务
        </span>
        <span v-if="taskRunning">
          <div style="display: inline-block;height: 12px; width: 12px; background: red; border-radius: 50%;"></div>
        有任务运行
        </span>

      </div>
    </div>

  </div>
</template>





<script>
import {ipcRenderer} from "electron";
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Menu",
  props: {
    dataList: {

      type: Array,
      required: true
    }
  },
  created() {
    function sendGPUInfoList() {
      ipcRenderer.send('getGPUInfoList')
    }
    setInterval(sendGPUInfoList, 1000);
    this.gpuInfoListListener = (event, data) => {
      this.gpuInfoList = data;
    };
    ipcRenderer.on("gpuInfoList",this.gpuInfoListListener)
    this.taskStatusListener = (event, data) => {
      this.taskRunning=data;
    };
    ipcRenderer.on('task-status',this.taskStatusListener)
    // ipcRenderer.send('get-task-status')
  },
  beforeUnmount() {
    ipcRenderer.off('task-status', this.taskStatusListener);
  },
  data() {
    return {
      taskRunning: false,
      gpuInfoList: [
        {
        }
      ],
      normalStyle: {
        background: '#42424E',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#D4D4D4', // 修改此处
      },
      selectedStyle: {
        background: '#2C2A38',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      },
      selectedIndex: 2, // 添加一个变量selectedIndex用于保存当前选中的item的index
    };
  },
  methods: {
    selectItem: function(index, router) {
      this.selectedIndex = index; // 点击时更新选中的index
      this.$router.push(router);
    },
  },
};
</script>

<style scoped>
*{
  margin: 0;
  padding: 0;
}
</style>
