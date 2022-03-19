<p align="center">
<img src="https:
</p>

<h1 align="center">
window-channel
</h1>
<p align="center">
A very simple window communication library.
<p>
<p align="center">
  <a href="https:
<p>
<h3 align="center">
<a><i>Get Start!</i></a>
</h3>
<br>

# Install
```
npm install @haiyaotec/window-channel
```

## Usage/Examples
`Client`
```typescript

import {WindowChannel} from '@imf/window-channel'





    let client = WindowChannel.newChannelClient(window,iFrame.contentWindow,"*")
    

    function f() {
        client.request('/hello', '客户端发送的消息', 1000)
            .then((value) => {
                console.log(value)
            })
            .catch((err) => {
                console.log(err)
            })
    }
    f()
    setInterval(f,3000)

```

`Server`
```typescript

import {WindowChannel} from '@imf/window-channel'



let service=WindowChannel.newChannelService(window)
    

service.listen('/hello',(value)=>{
    console.log(value)
    return '服务端发送的消息'
})

service.observe('/dingyue',()=>{
    console.log('订阅成功')
})

setTimeout(()=>{
    service.broadcast('/dingyue','聊天室广播内容')
},20000)

```

## License

[MIT](./LICENSE) License © 2021-Present [YuDong Su](https:
