<script>
// eslint-disable-next-line vue/no-export-in-script-setup
export default {
  name: "SubMenu",
  props: {
    dataList: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      normalStyle: {
        color: '#adadad',
        background: '#42424e',
        paddingLeft: '10px',
        paddingRight: '10px',
        margin: '0 20px'
      },
      selectedStyle: {
        color: '#ffffff',
        background: '#3aa1cc',
        paddingLeft: '10px',
        paddingRight: '10px',
        margin: '0 20px'
      },
      selectedIndex: 0, // 添加一个变量selectedIndex用于保存当前选中的item的index
    };
  },
  methods: {
    selectItem: function(index, router) {
      this.selectedIndex = index; // 点击时更新选中的index
      this.$router.push(router);
    },
  },

}
</script>

<template>
  <div style="display: flex; justify-content: center;">
    <button v-for="(item, index) in dataList"
            :key="item.id"
            :style="index === selectedIndex ? selectedStyle : normalStyle"
            v-on:click="selectItem(index, item.router)"
            class="button">
      {{item.text}}
    </button>
  </div>
</template>

<style scoped>
</style>
