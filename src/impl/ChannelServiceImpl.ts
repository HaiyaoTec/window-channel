import {ChannelService} from '../ChannelService'
import {ChannelUpstream, ChannelDownstream} from '../ChannelMessage'
import * as uuid from 'uuid'

type OnRequest = (request: any) => any
type OnObserve = (() => void) | undefined
//服务端实现类
export class ChannelServiceImpl implements ChannelService {
    serviceWindow: Window//服务端的window对象
    requestHandler = new Map<string, OnRequest>()
    observeHandler = new Map<string, OnObserve>()
    subscriptions = new Map<string, Set<MessageEvent>>()

    constructor(serviceWindow: Window) {
        this.serviceWindow = serviceWindow
        serviceWindow.addEventListener('message', this.receiveRequest.bind(this), false)
    }

    /**
     * 收到消息后会执行的接受请求的回调函数
     * @param ev 客户端发送来的消息对象
     */
    receiveRequest(ev: MessageEvent) {
        const request = (<ChannelUpstream>(ev.data))
        if (request.type === 'request' && this.requestHandler.has(request.destination)) {
            // @ts-ignore
            ev.source.postMessage(this.handleRequest(request), ev.origin)
        }
        if (request.type === 'subscribe' && this.observeHandler.has(request.destination)) {
            // @ts-ignore
            ev.source.postMessage(this.handleSubscribe(request, ev), ev.origin)
        }
        if (request.type === 'unsubscribe' && this.observeHandler.has(request.destination)) {
            // @ts-ignore
            ev.source.postMessage(this.handleUnSubscribe(request, ev), ev.origin)
        }
    }

    /**
     * 处理客户端发送的请求
     * @param request 客户端传入的消息对象
     */
    handleRequest(request: ChannelUpstream): ChannelDownstream {
        const response:ChannelDownstream = <ChannelDownstream>{
            type: 'response',
            requestId: request.requestId,
            destination: request.destination
        }
        try {
            let handler = this.requestHandler.get(request.destination)!!
            response.status = 200
            response.body = handler(request.body)
        } catch (e) {
            response.status = 400
            response.body = e
            response.description = 'Channel service handle request failed'
        }
        return response
    }

    /**
     * 处理客户端订阅的函数
     * @param request 客户端发送的消息对象
     * @param ev  客户端发送的消息事件对象
     */
    handleSubscribe(request: ChannelUpstream, ev: MessageEvent): ChannelDownstream {
        const response = <ChannelDownstream>{
            type: 'ack',
            requestId: request.requestId,
            destination: request.destination
        }
        try {
            let handler = this.observeHandler.get(request.destination)
            if (handler) {
                handler()
            }
            if (this.subscriptions.has(request.destination)) {
                this.subscriptions.get(request.destination)!!.add(ev)
            } else {
                this.subscriptions.set(request.destination, new Set<MessageEvent>().add(ev))
            }
            response.status = 200
        } catch (e) {
            response.status = 400
            response.body = e
            response.description = 'Channel service handle subscribe failed'
        }
        return response
    }

    /**
     * 处理取消订阅的方法
     * @param request 客户端发送的消息对象
     * @param ev  客户端发送的消息事件对象
     */
    handleUnSubscribe(request: ChannelUpstream, ev: MessageEvent): ChannelDownstream {
        const response = <ChannelDownstream>{
            type: 'ack',
            requestId: request.requestId,
            destination: request.destination,
            status: 200
        }
        if (this.subscriptions.has(request.destination)) {
            this.subscriptions.get(request.destination)!!.delete(ev)
        }
        return response
    }

    /**
     * 为客户端要请求的接口建立侦听
     * @param destination
     * @param serve
     */
    listen<REQUEST, RESPONSE>(destination: string, serve: (request: REQUEST) => RESPONSE): void {
        this.requestHandler.set(destination, serve)
    }


    observe(destination: string, serve?: () => void): void {
        this.observeHandler.set(destination, serve)
    }


    broadcast(destination: string, message: any): void {
        const response = <ChannelDownstream>{
            type: 'event',
            requestId: uuid.v4(),
            destination: destination,
            status: 200,
            body: message
        }
        this.subscriptions.get(destination)?.forEach((ev) => {
            // @ts-ignore
            ev.source.postMessage(JSON.parse(JSON.stringify(response)), ev.origin)
        })
    }

    finish(): void {
        this.serviceWindow.removeEventListener('message', this.receiveRequest, false)
    }
}