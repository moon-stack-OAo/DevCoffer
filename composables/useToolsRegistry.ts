import {
    categories,
    tools,
    toolsById,
    getBusinessCategories,
    formatHomeSubtitle,
    resolveToolId,
    toolIdAliases,
} from '../data/tools'
import { getToolImpl } from '../data/tool-impl'

export function useToolsRegistry() {
    return {
        categories,
        tools,
        toolsById,
        getBusinessCategories,
        formatHomeSubtitle,
        resolveToolId,
        toolIdAliases,
        getToolImpl,
    }
}
