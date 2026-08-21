/** 部署探活：不做任何工具业务 */
export default defineEventHandler(() => {
    return {
        ok: true,
        service: 'devcoffer',
        ts: Date.now(),
    }
})
