/**
 * 工具面板通用状态：input / output / error
 */
export function useToolState(initialInput = '') {
    const input = ref(initialInput)
    const output = ref('')
    const error = ref('')

    function clearError() {
        error.value = ''
    }

    function setError(msg: string) {
        error.value = msg
        output.value = ''
    }

    function setOutput(text: string) {
        output.value = text
        error.value = ''
    }

    function reset() {
        input.value = initialInput
        output.value = ''
        error.value = ''
    }

    return {
        input,
        output,
        error,
        clearError,
        setError,
        setOutput,
        reset,
    }
}
