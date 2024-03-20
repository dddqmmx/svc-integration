<template>
  <div class="container-fluid" style="height: 100vh; display: flex; flex-direction: column;">
    <div  style="
    height: 25px;
    line-height: 25px;
    background: #343442;
    -webkit-app-region: drag;
    color: white;
    ">

    </div>
    <div style="display: flex;max-height: calc(100% - 25px); flex-direction: row; flex-grow: 1;">
      <div class="left pre-scrollable" style="width: 175px; background: #42424E; overflow: auto; flex-shrink: 0;">
        <Menu :data-list="dataList">
        </Menu>
      </div>
      <div class="right"  style=" display: flex; flex-direction: column; flex-grow: 1;">
        <router-view style="flex-grow: 1; "/>
      </div>
    </div>
  </div>
</template>

<script>
import "@/components/Menu.vue"
import Menu from "@/components/Menu.vue";
// eslint-disable-next-line no-unused-vars
import {ipcRenderer} from "electron";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Main",
  components: {Menu},
  data:function (){
    return {
      dataList:[
        {

          text: "数据集",
          router:"/main/dataSet"
        },
        {
          text:"权重",
          router:"/main/weight"
        },
        {
          text:"推理",
          router:"/main/inference"
        },
        {
          text:"训练",
          router:"/main/training"
        },
        {
          text:"设置",
          router:"/main/setting"
        },
        // {
        //   icon:icon1,
        //   text:"反馈",
        //   router:"/main/setting"
        // }
      ]
    }
  },
  created() {
    let {ipcRenderer} = require('electron');
    ipcRenderer.send('resize', 850, 600);
    ipcRenderer.send('resizeMin', 850, 600);
    ipcRenderer.send("center");
  }
}
</script>

<style src="@/style/main.css" scoped></style>

<style>
body {
  margin: 0;
  padding: 0;
}

.container-fluid {
  display: flex;
  flex-direction: column;
}

.left.col-3.pre-scrollable {
  flex-grow: 1;
  overflow: auto;
}
.button{
  height: 45px;
  background: #7E7B7B;
  border: none;
  border-radius: 3px;
  color: white;
}
</style>
