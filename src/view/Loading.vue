<template>
  <div class="background">
  </div>
  <div id="text">
    <div style="
    position: absolute;
    left:50%;
    top:50%;
    transform: translate(-50%, -50%);
    -webkit-app-region: no-drag">
      <h1>svc-integration</h1>
      <p style="color:#000;">v0.0.1</p>
      <p v-on:click="greet">点击此处进入软件</p>
    </div>
  </div>

</template>

<script>
// import "@/style/loading.css"
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Loading",
  methods: {
    greet:function () {
      this.$router.push("/main")
    }
  },
  created: function() {
  }
}
</script>

<style src="@/style/loading.css" scoped></style>
