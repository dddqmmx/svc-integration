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
">
      <SubMenu :data-list="dataList">

      </SubMenu>

    </div>

    <div style="max-height: calc(100% - 80px);overflow: auto;">
      <router-view />
    </div>
  </div>

</template>

<script>

// import "@/style/loading.css"

import SubMenu from "@/components/SubMenu.vue";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Training",
  components: {SubMenu},
  data() {
    return {
      dataList:[
        {
          text: "开始训练",
          router:"/main/training/startTraining"
        },
        {
          text:"文件管理",
          router:"/main/training/fileManagement"
        },
        {
          text:"训练结果",
          router:"/main/training/trainingResults"
        },
      ]
    };
  }
}
</script>

<style scoped>
/* 滚动槽 */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
::-webkit-scrollbar-thumb {
  border-radius: 8px;
  background: #4D4D5A;
}
</style>
