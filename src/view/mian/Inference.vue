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
        <h5>推理</h5>
      </div>
      <div>
        <button style="color: #ff5f64;padding-left: 10px;padding-right: 10px" class="button" @click="inferenceStart">开始推理</button>
      </div>
    </div>

    <div style="max-height: calc(100% - 80px);overflow: auto;">
      <div style="padding: 20px; ">
        <div>
          <h6>模型选择</h6>
          <div style="background-color: #606068;
      color: white;
      padding: 10px;
      border-radius: 3px;">
            <select v-model="type"  @change="getModelList">
              <option>so-vits-svc-4.1</option>
              <option>so-vits-svc-4.0</option>
              <!--            <option>vits</option>-->
              <!--            <option>Retrieval-based-Voice-Conversion</option>-->
            </select>
            <br>
            权重:<select v-model="modelName" @change="getSpeakerList">
            <option v-for="modelName in modelList" :key="modelName">
              {{modelName}}
            </option>
          </select>
            说话人:<select v-model="speakerName" @change="getFileList">
            <option  v-for="speaker in speakerList" :key="speaker">
              {{speaker}}
            </option>
          </select>
          </div>
          <div v-if="displayOptions" style="margin-top: 10px">
            <h6>选择音频</h6>
            <div style="background-color: #606068;
      color: white;
      padding: 10px;
      border-radius: 3px;">
              <select v-model=audioType>
                <option value=1>手动选择</option>
                <option value=2>网易云</option>
              </select>
              <input type="checkbox" @click="clickVocalAndBackgroundMusicSeparationOption" v-model="vocalAndBackgroundMusicSeparationOption">人声伴奏分离
              <div v-if="audioType == 1"
                   @dragover.prevent @drop="onDrop"
                   style="width: calc(100%);  height: 150px; margin-top: 10px; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 5px dashed white;">
                <p v-if="dropFileList.length === 0">将文件拖到此处</p>
                <p v-if="dropFileList.length !== 0">已选择{{dropFileList.length}}个文件</p>
                <img style="width: 50px; height: 50px;" src="bg-upload.svg">
              </div>
              <div v-if="audioType == 2">
                <input v-model="keywords"><button @click="getNeteaseCloudMusicSearch">搜索</button>
                <table v-if="songs && songs.length > 0">
                  <tr>
                    <th></th>
                    <th>音乐名称</th>
                    <th>作者</th>
                  </tr>
                  <tr v-for="song in songs" :key="song">
                    <td><input type="checkbox"></td>
                    <td>{{song.name}}</td>
                    <td>
                      <span v-for="(artist,index) in song.artists" :key="artist">
                        {{artist.name}}
                        <span v-if="song.artists.length-1 != index">,</span>
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
          <div v-if="vocalAndBackgroundMusicSeparationOption" style="margin-top: 10px">
            <h6>人声伴奏分离<input type="button" value="+" @click="sumUvr5ProcessTime"><input type="button" value="-" @click="minusUvr5ProcessTime"></h6>
            <div>推理音频选择
              <select v-model="inferenceAudioChoice">
                <option v-for="(option, index) in options" :key="index" :value="option.value">{{ option.label }}</option>
              </select>
              <p>混音音量: <input type="number" v-model="inferenceAudioVolume"></p>
            </div>
            <span v-for="index in uvr5ProcessTime" :key="index">
              <div style="background-color: #606068;
              margin-top: 10px;
      color: white;
      padding: 10px;
      border-radius: 3px;">
                {{index}}.
                <select v-if="index>1" v-model="uvr5Parameters[index-1].inferenceFile" >
                  <option value="1">MainAudio</option>
                  <option value="2">SubAudio</option>
                </select>
                <select v-model="uvr5Parameters[index-1].uvr5WeightType" @change="onChangeUvr5WeightType(index-1)">
                  <option v-for="(value,key) in uvr5Models" :key="key">{{key}}</option>
                </select>
                <select v-if="Object.keys(uvr5Models).length >0 && uvr5Parameters[index-1].uvr5WeightType!=''" v-model="uvr5Parameters[index-1].uvr5Weight">
                  <option v-for="model in getUvr5Model(uvr5Parameters[index-1].uvr5WeightType)" :key="model">{{model}}</option>
                  <option v-for="model in getUvr5Model(uvr5Parameters[index-1].uvr5WeightType)" :key="model">{{model}}</option>
                </select>
                <p><input :checked="index===1" v-model="uvr5Parameters[index-1].useForAccompaniment" type="checkbox">把副音频做为伴奏</p>
                <p v-if="uvr5Parameters[index-1].useForAccompaniment">混音音量: <input type="number" v-model="uvr5Parameters[index-1].volume"></p>
                <span v-if="uvr5Parameters[index-1].uvr5WeightType === 'Demucs'">
                  <p>demucs_segment_size<input type="text" value="Default" v-model="uvr5Parameters[index-1].uvr5Ages.demucs_segment_size"></p>
                  <p>size of segments into which the audio is split, 1-100. higher = slower but better quality (default: Default).</p>
                  <p>demucs_shifts<input type="number" value="2" v-model="uvr5Parameters[index-1].uvr5Ages.demucs_shifts"></p>
                  <p>number of predictions with random shifts, higher = slower but better quality (default: 2).</p>
                  <p>demucs_overlap<input type="number" min="0.001" max="0.999" value="0.25" v-model="uvr5Parameters[index-1].uvr5Ages.demucs_overlap"></p>
                  <p>overlap between prediction windows, 0.001-0.999. higher = slower but better quality (default: 0.25).</p>
                  <p>demucs_segments_enabled<input type="checkbox" checked v-model="uvr5Parameters[index-1].uvr5Ages.demucs_segments_enabled"></p>
                  <p>enable segment-wise processing (default: True).</p>
                </span>
                <span v-if="uvr5Parameters[index-1].uvr5WeightType === 'MDX'">
                  <p>mdx_segment_size<input type="number" value="256" v-model="uvr5Parameters[index-1].uvr5Ages.mdx_segment_size"></p>
                  <p>larger consumes more resources, but may give better results (default: 256).</p>
                  <p>mdx_overlap<input type="number" min="0.001" max="0.999" value="0.25" v-model="uvr5Parameters[index-1].uvr5Ages.mdx_overlap"></p>
                  <p>amount of overlap between prediction windows, 0.001-0.999. higher is better but slower (default: 0.25)</p>
                  <p>mdx_batch_size<input type="number" value="1" v-model="uvr5Parameters[index-1].uvr5Ages.mdx_batch_size"></p>
                  <p>larger consumes more RAM but may process slightly faster (default: 1)</p>
                  <p>mdx_hop_length<input type="number" value="1024" v-model="uvr5Parameters[index-1].uvr5Ages.mdx_hop_length"></p>
                  <p>usually called stride in neural networks, only change if you know what you're doing (default: 1024).</p>
                  <p>mdx_enable_denoise<input type="checkbox" v-model="uvr5Parameters[index-1].uvr5Ages.mdx_enable_denoise"></p>
                  <p>enable denoising during separation (default: False).</p>
                </span>
                <span v-if="uvr5Parameters[index-1].uvr5WeightType === 'MDXC'">
                  <p>mdxc_segment_size<input type="number" value="256" v-model="uvr5Parameters[index-1].uvr5Ages.mdxc_segment_size"></p>
                  <p>larger consumes more resources, but may give better results (default: 256).</p>
                  <p>mdxc_use_model_segment_size<input type="checkbox" v-model="uvr5Parameters[index-1].uvr5Ages.mdxc_use_model_segment_size"></p>
                  <p>use model default segment size instead of the value from the config file.</p>
                  <p>mdxc_overlap<input type="number" min="2" max="50" value="8" v-model="uvr5Parameters[index-1].uvr5Ages.mdxc_overlap"></p>
                  <p>amount of overlap between prediction windows, 2-50. higher is better but slower (default: 8).</p>
                  <p>mdxc_batch_size<input type="number" value="1" v-model="uvr5Parameters[index-1].uvr5Ages.mdxc_batch_size"></p>
                  <p>larger consumes more RAM but may process slightly faster (default: 1).</p>
                  <p>mdxc_pitch_shift<input type="number" value="0" v-model="uvr5Parameters[index-1].uvr5Ages.mdxc_pitch_shift"></p>
                  <p>shift audio pitch by a number of semitones while processing. may improve output for deep/high vocals. (default: 0).</p>
                </span>
                <span v-if="uvr5Parameters[index-1].uvr5WeightType === 'VR'">
                  <p>vr_batch_size<input type="number" value="4" v-model="uvr5Parameters[index-1].uvr5Ages.vr_batch_size"></p>
                  <p>number of batches to process at a time. higher = more RAM, slightly faster processing (default: 4).</p>
                  <p>vr_window_size<input type="number" value="512" v-model="uvr5Parameters[index-1].uvr5Ages.vr_window_size"></p>
                  <p>balance quality and speed. 1024 = fast but lower, 320 = slower but better quality. (default: 512).</p>
                  <p>vr_aggression<input type="number" value="5" v-model="uvr5Parameters[index-1].uvr5Ages.vr_aggression"></p>
                  <p>intensity of primary stem extraction, -100 - 100. typically 5 for vocals & instrumentals (default: 5).</p>
                  <p>vr_enable_tta<input type="checkbox"  v-model="uvr5Parameters[index-1].uvr5Ages.vr_enable_tta"></p>
                  <p>enable Test-Time-Augmentation; slow but improves quality (default: False).</p>
                  <p>vr_high_end_process<input type="checkbox" v-model="uvr5Parameters[index-1].uvr5Ages.vr_high_end_process"></p>
                  <p>mirror the missing frequency range of the output (default: False).</p>
                  <p>vr_enable_post_process<input type="checkbox" v-model="uvr5Parameters[index-1].uvr5Ages.vr_enable_post_process"></p>
                  <p>identify leftover artifacts within vocal output; may improve separation for some songs (default: False).</p>
                  <p>vr_post_process_threshold<input type="number" min="0.1" max="0.3" value="0.2" v-model="uvr5Parameters[index-1].uvr5Ages.vr_post_process_threshold"></p>
                  <p>threshold for post_process feature: 0.1-0.3 (default: 0.2).</p>
                </span>
              </div>
            </span>
          </div>
          <div v-if="displayOptions">
            <h6 style="margin-top: 10px;">推理参数</h6>
            <div style="background-color: #606068;
      color: white;
      padding: 10px;
      border-radius: 3px;">
              <div>
                推理设备
                <select v-model="device">
                  <option value="0">自动选择</option>
                  <option value="1">cpu</option>
                  <option value="2">cuda</option>
                </select>
              </div>
              <div>
                <span>音高</span>
                <input v-model="trans">
              </div>
              <div>
                <span>音频强制切片</span>
                <input value="0">
              </div>
              <div v-if="displayClusterModelOption">
                聚类模型<input type="checkbox" v-model="displayClusterModelOptions">
              </div>
              <div v-if="displayClusterModelOptions">
                <span>聚类模型/特征检索混合比例</span>
                <input v-model="clusterInferRatio" type="number" min="0" max="1">
              </div>
              <div v-if="displayDiffusionModelOption">
                浅层扩散模型<input type="checkbox" v-model="displayDiffusionModelOptions">
              </div>
              <div v-if="displayDiffusionModelOptions">
                <span>浅扩散步数</span>
                <input v-model="k_step">
              </div>
              <div>
                <span>自动f0预测</span>
                <input v-model="autoPredictF0" type="checkbox">
              </div>
              <div v-if="autoPredictF0">
                <div>
                  <span>f0预测器</span>
                  <select v-model="f0Predictor">
                    <option>pm</option>
                    <option>dio</option>
                    <option>harvest</option>
                    <option>crepe</option>
                  </select>
                </div>
                <div>
                  <span>F0过滤阈值</span>
                  <input v-model="f0FilterThreshold">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="dropFileList.length>0" style="margin-top: 10px">
          <h6>结果:{{resultList.length}}/{{dropFileList.length}}</h6>
          <div style="background-color: #606068;
      color: white;
      padding: 10px;
      border-radius: 3px;">
            <audio v-for="request in resultList" :key="request" style="width: 100%" controls :src="getAudioSrc(request)"></audio>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import {ipcRenderer, remote} from "electron";

const fs = remote.require('fs');

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Inference",
  data:function () {
    return {
      inferenceAudioChoice:"",
      options: [],
      inference: false,
      resultList: [],
      vocalAndBackgroundMusicSeparationOption: true,
      displayOptions : false,
      displayClusterModelOption: false,
      displayClusterModelOptions: false,
      displayDiffusionModelOption: false,
      displayDiffusionModelOptions: false,
      audioType : 1,
      type : "so-vits-svc-4.1",
      modelList:[],
      modelName: "",
      speakerList: [],
      speakerName: "",
      config: "",
      device: 0,
      trans: 0,
      clusterInferRatio: 0.5,
      k_step: 100,
      autoPredictF0: false,
      f0Predictor: "pm",
      f0FilterThreshold: 0.05,
      dropFileList: [],
      keywords:"",
      songs:{},
      output_list:[],
      inferenceAudioVolume: 0.8,
      uvr5Parameters:[
        {
          useForAccompaniment:true,
          volume:0.8,
          uvr5WeightType:"",
          uvr5Ages:{
            demucs_segment_size:'Default',
            demucs_shifts:2,
            demucs_overlap:0.25,
            demucs_segments_enabled:true,
            mdx_segment_size:256,
            mdx_overlap:0.25,
            mdx_batch_size:1,
            mdx_hop_length:1024,
            mdx_enable_denoise:false,
            mdxc_segment_size:256,
            mdxc_use_model_segment_size:false,
            mdxc_overlap:8,
            mdxc_batch_size:1,
            mdxc_pitch_shift:0,
            vr_batch_size:4,
            vr_window_size:512,
            vr_aggression:5,
            vr_enable_tta:false,
            vr_high_end_process:false,
            vr_enable_post_process:false,
            vr_post_process_threshold:0.2
          }
        },
      ],
      mixerList:[],
      uvr5ProcessTime : 1,
      outputNumber: 0,
      uvr5Models:{}
    }
  },

  created: function() {
    ipcRenderer.send('get-config');
    const getConfigListener = (event, config) => {
      this.config = config;
      this.getModelList();
      this.updateOptions();
      ipcRenderer.off('config', getConfigListener);
      const audioMixerResultListener = (event, outPath) => {
        this.resultList.push(outPath);
      };
      ipcRenderer.on('audio-mixer-result', audioMixerResultListener);
    };
    ipcRenderer.on('config', getConfigListener);
    ipcRenderer.send('get-uvr-list-models')
    const getUvrListModelsListener = (event, result) => {
      this.uvr5Models=JSON.parse(result);
      ipcRenderer.off('list-models-result', getUvrListModelsListener);
    };
    ipcRenderer.on('list-models-result', getUvrListModelsListener);
  },
  methods: {
    updateOptions() {
      this.options = [];
      for (let i = 1; i <= this.uvr5Parameters.length; i++) {
        // this.options.push(`${i}.MainAudio`, `${i}.SubAudio`);
        this.options.push({
          label: `${i}.MainAudio`,
          value: `${i}.1`
        });
        this.options.push({
          label: `${i}.SubAudio`,
          value: `${i}.2`
        });
      }
    },
    getUvr5Model(modelType) {
      const model = []
      for (const uvr5Model in this.uvr5Models[modelType]) {
        const value = this.uvr5Models[modelType][uvr5Model];
        if (typeof value === 'string'){
          model.push(value)
        }else if (typeof value === 'object'){
          const first_key = Object.keys(value)[0]
          model.push(first_key)
        }
      }
      return model;
    },
    sumUvr5ProcessTime(){
      this.uvr5Parameters = this.uvr5Parameters.concat({
        useForAccompaniment:false,
        volume:0.8,
        uvr5WeightType:"",
        inferenceFile:1,
        uvr5Ages:{
          demucs_segment_size:'Default',
          demucs_shifts:2,
          demucs_overlap:0.25,
          demucs_segments_enabled:true,
          mdx_segment_size:256,
          mdx_overlap:0.25,
          mdx_batch_size:1,
          mdx_hop_length:1024,
          mdx_enable_denoise:false,
          mdxc_segment_size:256,
          mdxc_use_model_segment_size:false,
          mdxc_overlap:8,
          mdxc_batch_size:1,
          mdxc_pitch_shift:0,
          vr_batch_size:4,
          vr_window_size:512,
          vr_aggression:5,
          vr_enable_tta:false,
          vr_high_end_process:false,
          vr_enable_post_process:false,
          vr_post_process_threshold:0.2
        }
      });
      this.uvr5ProcessTime = this.uvr5ProcessTime+1;
      this.onChangeUvr5WeightType(this.uvr5ProcessTime-1);
      this.updateOptions()
    },
    minusUvr5ProcessTime(){
      if (this.uvr5ProcessTime !== 1){
        this.uvr5ProcessTime = this.uvr5ProcessTime-1;
        this.uvr5Parameters = this.uvr5Parameters.filter((item, index) => index !== this.uvr5ProcessTime);
      }
      this.updateOptions()
    },
    clickVocalAndBackgroundMusicSeparationOption(e){
      if (e.target.checked) {
        this.onChangeUvr5WeightType(0);
      }
    },
    onChangeUvr5WeightType(index){
      index
    },
    getNeteaseCloudMusicSearch(){
    },
    getAudioSrc(filePath) {
      // Use the Node.js fs module to read the file
      try {
        const data = fs.readFileSync(filePath);
        const blob = new Blob([data], { type: 'audio/flac' });
        return URL.createObjectURL(blob);
      } catch (error) {
        console.error('Error loading audio:', error);
        return '';
      }
    },
    onDrop(event) {
      event.preventDefault();
      this.dropFileList = event.dataTransfer.files;
    },
    resetOption:function () {
      this.displayClusterModelOption = false;
      this.displayClusterModelOptions = false;
      this.displayDiffusionModelOption = false;
      this.displayDiffusionModelOptions = false;
    },
    getFileList:function () {
      const getFilesAndFoldersNamesListener = (event, items) => {
        this.displayOptions = true;
        if (this.type === "so-vits-svc-4.1"||this.type === "so-vits-svc-4.0"){
          if (items.includes('kmeans.pt')){
            this.displayClusterModelOption = true;
          }
        }
        if (this.type === "so-vits-svc-4.1"){
          if (items.includes('diffusion.pt') && items.includes('diffusionConfig.yaml')){
            this.displayDiffusionModelOption = true;
          }
        }
        ipcRenderer.off("files-and-folders-names", getFilesAndFoldersNamesListener);
      };
      ipcRenderer.send('get-files-and-folders-names', this.config.workingDirectory + '/weights/'+this.type+'/'+this.modelName, 'file');
      ipcRenderer.on("files-and-folders-names", getFilesAndFoldersNamesListener);
    },
    getSpeakerList:function () {
      const spkKeys = []; // 用于存储 spk 的键的数组
      const getJsonFileListener = (event,jsonFile) => {
        ipcRenderer.off("json-file", getJsonFileListener);

        // 将 spk 属性的键存储到数组中
        const spk = jsonFile.spk;
        Object.keys(spk).forEach(key => {
          if (Object.prototype.hasOwnProperty.call(spk, key)) {
            spkKeys.push(key);
          }
        });
        this.speakerList = spkKeys;

        ipcRenderer.off("json-file", getJsonFileListener);
      };
      ipcRenderer.send('get-json-file', this.config.workingDirectory + '/weights/'+this.type+"/"+this.modelName+"/config.json");
      ipcRenderer.on("json-file", getJsonFileListener);
    },
    getModelList:function () {
      this.displayOptions = false;
      this.speakerList = [];
      this.modelName = '';
      this.speakerList = '';
      this.resetOption()
      const getFilesAndFoldersNamesListener = (event, items) => {
        this.modelList = items
        ipcRenderer.off("files-and-folders-names", getFilesAndFoldersNamesListener);
      };
      ipcRenderer.send('get-files-and-folders-names', this.config.workingDirectory + '/weights/'+this.type, 'folder');
      ipcRenderer.on("files-and-folders-names", getFilesAndFoldersNamesListener);
    },
    inferenceStart : function () {
      this.resultList = [];
      this.outputNumber = 0;
      if(this.vocalAndBackgroundMusicSeparationOption) {
        let uvr5ArgList = [];
        for (let dropFile of this.dropFileList) {
          let uvr5Args = [];
          for (let uvr5Parameter in this.uvr5Parameters) {
            let args = [];
            args.push(dropFile.path)
            args.concat(['--model_filename',uvr5Parameter.uvr5WeightType])
            uvr5Parameter = this.uvr5Parameters[uvr5Parameter]
            Object.keys(uvr5Parameter.uvr5Ages).forEach(function (key) {
              const value = uvr5Parameter.uvr5Ages[key];
              if (key.startsWith(uvr5Parameter.uvr5WeightType.toLowerCase())){
                if (typeof value == 'boolean' && value){
                  args.push('--'+key)
                }else if (typeof value != 'boolean'){
                  args = args.concat(['--'+key,value])
                }
              }
            });
            uvr5Args.push({inferenceFile:uvr5Parameter.inferenceFile,args:args});
          }
          uvr5ArgList.push(uvr5Args)
        }
        console.log(uvr5ArgList)
        const inferenceFileArray = [];
        ipcRenderer.send("uvr5-inference", JSON.stringify(uvr5ArgList));
        const uvr5InferenceResult = (event, output_list) => {
          for (const i in output_list){
            const outputs = output_list[i];
            const mixers = []
            for (const j in outputs){
              if (this.uvr5Parameters[j].useForAccompaniment){
                mixers.push({volume:this.uvr5Parameters[j].volume,audioPath:this.config.workingDirectory + "/tmp/uvr5_output/"+outputs[j].subAudio})
                console.log(this.config.workingDirectory + "/tmp/uvr5_output/"+outputs[j].subAudio)

              }
            }
            if (this.inferenceAudioChoice.split('.')[1] == "1"){
              inferenceFileArray.push(outputs[this.inferenceAudioChoice.split('.')[0]-1].mainAudio)
            }else {
              inferenceFileArray.push(outputs[this.inferenceAudioChoice.split('.')[0]-1].subAudio)
            }
            this.mixerList.push(mixers)
          }
          console.log(this.mixerList)
          let fileList = [];
          for (let i = 0; i < this.dropFileList.length; i++){
            fileList[i]={name:inferenceFileArray[i],path:this.config.workingDirectory + "/tmp/uvr5_output/" + inferenceFileArray[i]}
          }
          this.inferenceSVC(fileList);
          ipcRenderer.off("uvr5-inference-result", uvr5InferenceResult);
         };
        ipcRenderer.on("uvr5-inference-result",uvr5InferenceResult)
      }
    },
    inferenceSVC(fileList){
      if (this.type === "so-vits-svc-4.1"||this.type === "so-vits-svc-4.0"){
        const data = this;
        const cpSuccess = (event, fileNameList) => {
          let argList = [];
          if (data.dropFileList.length === 0) {
            alert('你并没有选择文件');
          }else {
            data.inference = true;
            fileNameList.forEach((file, index) => {
              let arg = [
                data.config.workingDirectory+'/program/so-vits-svc/inference_main.py',
                "-m", data.config.workingDirectory+"/weights/"+data.type+"/"+data.modelName+"/G.pth",
                '-c', data.config.workingDirectory+'/weights/'+data.type+'/'+data.modelName+'/config.json',
                '-n', file, '-t', data.trans,
                '-s', data.speakerName,
                "-wf", "wav"
              ];
              if (this.displayClusterModelOptions){
                arg = arg.concat(['-cm',data.config.workingDirectory+'/weights/'+data.type+'/'+data.modelName+'/kmeans.pt','-cr',data.clusterInferRatio])
              }
              if (data.device != 0){
                if (data.device == 1){
                  arg = arg.concat(['-d','cpu'])
                }else
                if (data.device == 2){
                  arg = arg.concat(['-d','cuda'])
                }
              }
              if (data.displayDiffusionModelOptions){
                arg = arg.concat(['-dm',data.config.workingDirectory+'/weights/'+data.type+'/'+data.modelName+'/diffusion.pt','-dc',data.config.workingDirectory+'/weights/'+data.type+'/'+data.modelName+'/diffusionConfig.yaml','-ks',data.k_step])
              }
              if (data.autoPredictF0){
                arg = arg.concat(['-a',true,'-f0p',data.f0Predictor,'-ft',data.f0FilterThreshold])
              }
              argList[index] = arg;
            });
          }
          ipcRenderer.off("cp-success",cpSuccess);
          ipcRenderer.send("so-vits-svc-inference",JSON.stringify(argList))
          const inferenceResult = (event, filePath, index) => {
            if (filePath == "over") {
              ipcRenderer.off("so-vits-svc-inference", inferenceResult);
            }else {
              if (this.vocalAndBackgroundMusicSeparationOption){
                let outPath = data.config.workingDirectory+'/audio/result/output'+this.outputNumber+'.wav';
                let arg = [data.config.workingDirectory+'/program/utils/audio_mixer.py'];
                arg.push(filePath)
                for (let mixerInfo of this.mixerList[index]) {
                  arg.push(mixerInfo.audioPath)
                }
                arg = arg.concat(['--output',outPath,'--volumes'])
                arg.push(this.inferenceAudioVolume)
                for (let mixerInfo of this.mixerList[index]) {
                  arg.push(mixerInfo.volume)
                }
                ipcRenderer.send("audio-mixer",arg,outPath)
                this.outputNumber = this.outputNumber +1
              }else {
                this.resultList.push(filePath);
              }
            }
          }
          ipcRenderer.on("so-vits-svc-inference",inferenceResult)
        }
        ipcRenderer.send('cp',fileList,this.config.workingDirectory+'/program/so-vits-svc/raw');
        ipcRenderer.on("cp-success",cpSuccess)
      }
    },
  },
}
</script>

<style scoped>
*{
  margin: 0;
  padding: 0;
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


</style>
