import { createApp } from 'vue'
import {createRouter, createWebHashHistory} from 'vue-router'
import app from './App.vue'
import main from './view/Main.vue'
// import loading from './view/Loading.vue'
import setting from "@/view/mian/Setting.vue";
import dataSet from "@/view/mian/DataSet.vue";
import inference from "@/view/mian/Inference.vue";
import training from "@/view/mian/Training.vue";
import weight from "@/view/mian/Weight.vue"
import datasetList from "@/view/mian/data_set/DatasetList.vue"
import importAudio from "@/view/mian/data_set/ImportAudio.vue"
import processAudio from "@/view/mian/data_set/ProcessAudio.vue"
import fileManagement from "@/view/mian/training/FileManagement.vue"
import startTraining from "@/view/mian/training/StartTraining.vue"
import trainingResults from "@/view/mian/training/TrainingResults.vue"
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'

const routes = [
    { path: '/', redirect: '/main' },
    {
        path: '/main',
        component: main,
        redirect: '/main/inference',
        children: [
            {
                path: 'setting',
                component: setting
            },
            {
                path: 'dataSet',
                component: dataSet,
                redirect: '/main/dataSet/datasetList',
                children: [
                    {
                        path: 'datasetList',
                        component: datasetList
                    },
                    {
                        path: 'importAudio',
                        component: importAudio
                    },
                    {
                        path: 'processAudio',
                        component: processAudio
                    },
                ]
            },
            {
                path: 'inference',
                component: inference,

            },
            {
                path: 'training',
                component: training,
                redirect: '/main/training/startTraining',
                children: [
                    {
                        path: 'fileManagement',
                        component: fileManagement
                    },
                    {
                        path: 'startTraining',
                        component: startTraining
                    },
                    {
                        path: 'trainingResults',
                        component: trainingResults
                    },
                ]
            },
            {
                path: 'weight',
                component: weight
            }
        ]
    }
]


const router = createRouter({
    mode: 'hash', // Change this to 'hash'
    history: createWebHashHistory(), // Use createWebHashHistory() instead of createWebHistory()
    routes,
})

let App = createApp(app);
App.use(router)
App.mount('#app');
