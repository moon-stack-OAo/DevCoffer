<script setup lang="ts">
import ToolsEncodeBasenTool from '~/components/tools/encode/BasenTool.vue'
import ToolsEncodeUrlTool from '~/components/tools/encode/UrlTool.vue'
import ToolsEncodeHexTool from '~/components/tools/encode/HexTool.vue'
import ToolsEncodeUnicodeTool from '~/components/tools/encode/UnicodeTool.vue'
import ToolsEncodeHtmlescapeTool from '~/components/tools/encode/HtmlescapeTool.vue'
import ToolsEncodeJavaescapeTool from '~/components/tools/encode/JavaescapeTool.vue'
import ToolsEncodeMorseTool from '~/components/tools/encode/MorseTool.vue'
import ToolsEncodeCharsetTool from '~/components/tools/encode/CharsetTool.vue'
import ToolsGenerateUuidTool from '~/components/tools/generate/UuidTool.vue'
import ToolsFormatJsonTool from '~/components/tools/format/JsonTool.vue'
import ToolsFormatJsonflatTool from '~/components/tools/format/JsonflatTool.vue'
import ToolsFormatJsondiffTool from '~/components/tools/format/JsondiffTool.vue'
import ToolsFormatEnvfmtTool from '~/components/tools/format/EnvfmtTool.vue'
import ToolsFormatInifmtTool from '~/components/tools/format/InifmtTool.vue'
import ToolsFormatPropertiesfmtTool from '~/components/tools/format/PropertiesfmtTool.vue'
import ToolsFormatSqlTool from '~/components/tools/format/SqlTool.vue'
import ToolsFormatXmlTool from '~/components/tools/format/XmlTool.vue'
import ToolsFormatJson5fmtTool from '~/components/tools/format/Json5fmtTool.vue'
import ToolsFormatJsonconvertTool from '~/components/tools/format/JsonconvertTool.vue'
import ToolsFormatJsonpathTool from '~/components/tools/format/JsonpathTool.vue'
import ToolsFormatCssfmtTool from '~/components/tools/format/CssfmtTool.vue'
import ToolsFormatNginxfmtTool from '~/components/tools/format/NginxfmtTool.vue'
import ToolsFormatGraphqlfmtTool from '~/components/tools/format/GraphqlfmtTool.vue'
import ToolsFormatYamlTool from '~/components/tools/format/YamlTool.vue'
import ToolsTextLineendingTool from '~/components/tools/text/LineendingTool.vue'
import ToolsTextTextlinesTool from '~/components/tools/text/TextlinesTool.vue'
import ToolsTextStatsTool from '~/components/tools/text/StatsTool.vue'
import ToolsTextDesensitizeTool from '~/components/tools/text/DesensitizeTool.vue'
import ToolsTextTplreplaceTool from '~/components/tools/text/TplreplaceTool.vue'
import ToolsTextZhconvertTool from '~/components/tools/text/ZhconvertTool.vue'
import ToolsTextCsvTool from '~/components/tools/text/CsvTool.vue'
import ToolsTextRegexTool from '~/components/tools/text/RegexTool.vue'
import ToolsTextMdtableTool from '~/components/tools/text/MdtableTool.vue'
import ToolsSecurityHashTool from '~/components/tools/security/HashTool.vue'
import ToolsSecurityHmacTool from '~/components/tools/security/HmacTool.vue'
import ToolsSecurityRandomTool from '~/components/tools/security/RandomTool.vue'
import ToolsSecurityPwdstrengthTool from '~/components/tools/security/PwdstrengthTool.vue'
import ToolsSecurityTotpTool from '~/components/tools/security/TotpTool.vue'
import ToolsSecurityOauth2pkceTool from '~/components/tools/security/Oauth2pkceTool.vue'
import ToolsSecurityCvssTool from '~/components/tools/security/CvssTool.vue'
import ToolsSecurityJwtTool from '~/components/tools/security/JwtTool.vue'
import ToolsGenerateUlidTool from '~/components/tools/generate/UlidTool.vue'
import ToolsGenerateSnowflakeTool from '~/components/tools/generate/SnowflakeTool.vue'
import ToolsGenerateTsTool from '~/components/tools/generate/TsTool.vue'
import ToolsGenerateCaseTool from '~/components/tools/generate/CaseTool.vue'
import ToolsGenerateBaseconvertTool from '~/components/tools/generate/BaseconvertTool.vue'
import ToolsGenerateBytesizeTool from '~/components/tools/generate/BytesizeTool.vue'
import ToolsGenerateSemverTool from '~/components/tools/generate/SemverTool.vue'
import ToolsGenerateChmodcalcTool from '~/components/tools/generate/ChmodcalcTool.vue'
import ToolsGenerateCnyamountTool from '~/components/tools/generate/CnyamountTool.vue'
import ToolsGenerateIdvalidateTool from '~/components/tools/generate/IdvalidateTool.vue'
import ToolsGenerateDatecalcTool from '~/components/tools/generate/DatecalcTool.vue'
import ToolsGenerateTimezoneTool from '~/components/tools/generate/TimezoneTool.vue'
import ToolsGenerateLoremTool from '~/components/tools/generate/LoremTool.vue'
import ToolsGenerateGitignoreTool from '~/components/tools/generate/GitignoreTool.vue'
import ToolsGenerateCorsgenTool from '~/components/tools/generate/CorsgenTool.vue'
import ToolsGenerateCachecontrolTool from '~/components/tools/generate/CachecontrolTool.vue'
import ToolsGenerateResratioTool from '~/components/tools/generate/ResratioTool.vue'
import ToolsGenerateMediaqueryTool from '~/components/tools/generate/MediaqueryTool.vue'
import ToolsGenerateCssclampTool from '~/components/tools/generate/CssclampTool.vue'
import ToolsGenerateDatamockTool from '~/components/tools/generate/DatamockTool.vue'
import ToolsGenerateJavatimefmtTool from '~/components/tools/generate/JavatimefmtTool.vue'
import ToolsGenerateSpringbindingTool from '~/components/tools/generate/SpringbindingTool.vue'
import ToolsCodegenMavencoordTool from '~/components/tools/codegen/MavencoordTool.vue'
import ToolsCodegenEmailTool from '~/components/tools/codegen/EmailTool.vue'
import ToolsCodegenJavastreamTool from '~/components/tools/codegen/JavastreamTool.vue'
import ToolsCodegenJavabuilderTool from '~/components/tools/codegen/JavabuilderTool.vue'
import ToolsCodegenBeanvalTool from '~/components/tools/codegen/BeanvalTool.vue'
import ToolsCodegenJsontopojoTool from '~/components/tools/codegen/JsontopojoTool.vue'
import ToolsCodegenJson2tsTool from '~/components/tools/codegen/Json2tsTool.vue'
import ToolsDebugUrlparserTool from '~/components/tools/debug/UrlparserTool.vue'
import ToolsDebugUrlqueryTool from '~/components/tools/debug/UrlqueryTool.vue'
import ToolsDebugCronTool from '~/components/tools/debug/CronTool.vue'
import ToolsDebugSqlbindTool from '~/components/tools/debug/SqlbindTool.vue'
import ToolsDebugStacktraceTool from '~/components/tools/debug/StacktraceTool.vue'
import ToolsDebugThreaddumpTool from '~/components/tools/debug/ThreaddumpTool.vue'
import ToolsReferenceHttpstatusTool from '~/components/tools/reference/HttpstatusTool.vue'
import ToolsReferenceMimetypeTool from '~/components/tools/reference/MimetypeTool.vue'
import ToolsReferenceRefBrowseTool from '~/components/tools/reference/RefBrowseTool.vue'
import ToolsDebugIpTool from '~/components/tools/debug/IpTool.vue'
import ToolsDebugCookiecacheTool from '~/components/tools/debug/CookiecacheTool.vue'
import ToolsDebugLogfmtTool from '~/components/tools/debug/LogfmtTool.vue'
import ToolsDebugLogpatternTool from '~/components/tools/debug/LogpatternTool.vue'
import ToolsDebugTraceheaderTool from '~/components/tools/debug/TraceheaderTool.vue'
import ToolsDebugCsselectorTool from '~/components/tools/debug/CsselectorTool.vue'
import ToolsDebugSpecificityTool from '~/components/tools/debug/SpecificityTool.vue'
import ToolsDebugPoolcalcTool from '~/components/tools/debug/PoolcalcTool.vue'
import ToolsDebugQuartzcronTool from '~/components/tools/debug/QuartzcronTool.vue'
import ToolsDebugUaparserTool from '~/components/tools/debug/UaparserTool.vue'
import ToolsDebugNginxlogTool from '~/components/tools/debug/NginxlogTool.vue'
import ToolsDebugMybatissqllogTool from '~/components/tools/debug/MybatissqllogTool.vue'
import ToolsTextRegexjavaTool from '~/components/tools/text/RegexjavaTool.vue'
import ToolsTextDiffTool from '~/components/tools/text/DiffTool.vue'
import ToolsTextMarkdownTool from '~/components/tools/text/MarkdownTool.vue'
import ToolsFormatWebfmtTool from '~/components/tools/format/WebfmtTool.vue'
import ToolsFormatJson2sqlTool from '~/components/tools/format/Json2sqlTool.vue'
import ToolsFormatJsonschemaTool from '~/components/tools/format/JsonschemaTool.vue'
import ToolsEncodeImgbase64Tool from '~/components/tools/encode/Imgbase64Tool.vue'
import ToolsSecurityJwtgenTool from '~/components/tools/security/JwtgenTool.vue'
import ToolsSecurityJwtverifyTool from '~/components/tools/security/JwtverifyTool.vue'
import ToolsSecurityWebhooksigTool from '~/components/tools/security/WebhooksigTool.vue'
import ToolsCodegenJson2codeTool from '~/components/tools/codegen/Json2codeTool.vue'
import ToolsCodegenSqltopojoTool from '~/components/tools/codegen/SqltopojoTool.vue'
import ToolsCodegenDdl2entityTool from '~/components/tools/codegen/Ddl2entityTool.vue'
import ToolsCodegenSql2mybatisTool from '~/components/tools/codegen/Sql2mybatisTool.vue'
import ToolsCodegenFeigngenTool from '~/components/tools/codegen/FeigngenTool.vue'
import ToolsCodegenFlywaygenTool from '~/components/tools/codegen/FlywaygenTool.vue'
import ToolsCodegenMapstructTool from '~/components/tools/codegen/MapstructTool.vue'
import ToolsCodegenEntityconvertTool from '~/components/tools/codegen/EntityconvertTool.vue'
import ToolsCodegenTestgenTool from '~/components/tools/codegen/TestgenTool.vue'
import ToolsCodegenJmhTool from '~/components/tools/codegen/JmhTool.vue'
import ToolsCodegenJmhproTool from '~/components/tools/codegen/JmhproTool.vue'
import ToolsSecurityHashextTool from '~/components/tools/security/HashextTool.vue'
import ToolsSecurityAesTool from '~/components/tools/security/AesTool.vue'
import ToolsSecurityJasyptTool from '~/components/tools/security/JasyptTool.vue'
import ToolsSecurityRsaTool from '~/components/tools/security/RsaTool.vue'
import ToolsSecurityBcryptTool from '~/components/tools/security/BcryptTool.vue'
import ToolsSecurityGmsmTool from '~/components/tools/security/GmsmTool.vue'
import ToolsSecurityPbkdf2Tool from '~/components/tools/security/Pbkdf2Tool.vue'
import ToolsSecurityCertparserTool from '~/components/tools/security/CertparserTool.vue'
import ToolsGenerateColorTool from '~/components/tools/generate/ColorTool.vue'
import ToolsGenerateCssunitTool from '~/components/tools/generate/CssunitTool.vue'
import ToolsGenerateBoxshadowTool from '~/components/tools/generate/BoxshadowTool.vue'
import ToolsGenerateGradientTool from '~/components/tools/generate/GradientTool.vue'
import ToolsGenerateFlexgridTool from '~/components/tools/generate/FlexgridTool.vue'
import ToolsGenerateCubicbezierTool from '~/components/tools/generate/CubicbezierTool.vue'
import ToolsGenerateContrastTool from '~/components/tools/generate/ContrastTool.vue'
import ToolsGenerateSvgoptTool from '~/components/tools/generate/SvgoptTool.vue'
import ToolsGenerateFaviconTool from '~/components/tools/generate/FaviconTool.vue'
import ToolsGenerateFontpreviewTool from '~/components/tools/generate/FontpreviewTool.vue'
import ToolsGenerateImageCompressTool from '~/components/tools/generate/ImageCompressTool.vue'
import ToolsGenerateImgshuffleTool from '~/components/tools/generate/ImgshuffleTool.vue'
import ToolsTextQrcodeTool from '~/components/tools/text/QrcodeTool.vue'
import ToolsTextBarcodeTool from '~/components/tools/text/BarcodeTool.vue'
import ToolsTextHtmlmdTool from '~/components/tools/text/HtmlmdTool.vue'
import ToolsFormatTomlTool from '~/components/tools/format/TomlTool.vue'
import ToolsFormatSqldialectTool from '~/components/tools/format/SqldialectTool.vue'
import ToolsFormatDbtypeTool from '~/components/tools/format/DbtypeTool.vue'
import ToolsFormatXpathTool from '~/components/tools/format/XpathTool.vue'
import ToolsFormatSqlexplainTool from '~/components/tools/format/SqlexplainTool.vue'
import ToolsFormatJavafmtTool from '~/components/tools/format/JavafmtTool.vue'
import ToolsFormatDdldiffTool from '~/components/tools/format/DdldiffTool.vue'
import ToolsFormatJsonexcelTool from '~/components/tools/format/JsonexcelTool.vue'
import ToolsFormatImgtopdfTool from '~/components/tools/format/ImgtopdfTool.vue'
import ToolsFormatPdfmergeTool from '~/components/tools/format/PdfmergeTool.vue'
import ToolsFormatOpenapiviewTool from '~/components/tools/format/OpenapiviewTool.vue'
import ToolsEncodeProtobufTool from '~/components/tools/encode/ProtobufTool.vue'
import ToolsCodegenOpenapi2tsTool from '~/components/tools/codegen/Openapi2tsTool.vue'
import ToolsCodegenPlantumlTool from '~/components/tools/codegen/PlantumlTool.vue'
import ToolsCodegenDdlmermaidTool from '~/components/tools/codegen/DdlmermaidTool.vue'
import ToolsCodegenMermaidTool from '~/components/tools/codegen/MermaidTool.vue'
import ToolsCodegenDdl2crudTool from '~/components/tools/codegen/Ddl2crudTool.vue'
import ToolsCodegenJsrunTool from '~/components/tools/codegen/JsrunTool.vue'
import ToolsCodegenHtmlrunTool from '~/components/tools/codegen/HtmlrunTool.vue'
import ToolsCodegenPyrunTool from '~/components/tools/codegen/PyrunTool.vue'
import ToolsDebugSpelTool from '~/components/tools/debug/SpelTool.vue'
import ToolsDebugWsTool from '~/components/tools/debug/WsTool.vue'
import ToolsDebugStompTool from '~/components/tools/debug/StompTool.vue'
import ToolsDebugHttpdebugTool from '~/components/tools/debug/HttpdebugTool.vue'
import ToolsDebugGrpcTool from '~/components/tools/debug/GrpcTool.vue'
import ToolsDebugSseTool from '~/components/tools/debug/SseTool.vue'
import ToolsDebugVideodebugTool from '~/components/tools/debug/VideodebugTool.vue'
import ToolsDebugMqttTool from '~/components/tools/debug/MqttTool.vue'
import ToolsDebugMappickerTool from '~/components/tools/debug/MappickerTool.vue'

const route = useRoute()
const {
    toolsById,
    tools,
    resolveToolId,
    getBusinessCategories,
    getToolImpl,
} = useToolsRegistry()

/** 已 Vue 化组件显式映射（避免 resolveComponent 名称歧义） */
const vueToolComponents: Record<string, Component> = {
    basen: ToolsEncodeBasenTool,
    url: ToolsEncodeUrlTool,
    hex: ToolsEncodeHexTool,
    unicode: ToolsEncodeUnicodeTool,
    htmlescape: ToolsEncodeHtmlescapeTool,
    javaescape: ToolsEncodeJavaescapeTool,
    morse: ToolsEncodeMorseTool,
    charset: ToolsEncodeCharsetTool,
    uuid: ToolsGenerateUuidTool,
    json: ToolsFormatJsonTool,
    jsonflat: ToolsFormatJsonflatTool,
    jsondiff: ToolsFormatJsondiffTool,
    envfmt: ToolsFormatEnvfmtTool,
    inifmt: ToolsFormatInifmtTool,
    propertiesfmt: ToolsFormatPropertiesfmtTool,
    sql: ToolsFormatSqlTool,
    xml: ToolsFormatXmlTool,
    json5fmt: ToolsFormatJson5fmtTool,
    jsonconvert: ToolsFormatJsonconvertTool,
    jsonpath: ToolsFormatJsonpathTool,
    cssfmt: ToolsFormatCssfmtTool,
    nginxfmt: ToolsFormatNginxfmtTool,
    graphqlfmt: ToolsFormatGraphqlfmtTool,
    yaml: ToolsFormatYamlTool,
    lineending: ToolsTextLineendingTool,
    textlines: ToolsTextTextlinesTool,
    stats: ToolsTextStatsTool,
    desensitize: ToolsTextDesensitizeTool,
    tplreplace: ToolsTextTplreplaceTool,
    zhconvert: ToolsTextZhconvertTool,
    csv: ToolsTextCsvTool,
    regex: ToolsTextRegexTool,
    mdtable: ToolsTextMdtableTool,
    hash: ToolsSecurityHashTool,
    hmac: ToolsSecurityHmacTool,
    random: ToolsSecurityRandomTool,
    pwdstrength: ToolsSecurityPwdstrengthTool,
    totp: ToolsSecurityTotpTool,
    oauth2pkce: ToolsSecurityOauth2pkceTool,
    cvss: ToolsSecurityCvssTool,
    jwt: ToolsSecurityJwtTool,
    ulid: ToolsGenerateUlidTool,
    snowflake: ToolsGenerateSnowflakeTool,
    ts: ToolsGenerateTsTool,
    case: ToolsGenerateCaseTool,
    baseconvert: ToolsGenerateBaseconvertTool,
    bytesize: ToolsGenerateBytesizeTool,
    semver: ToolsGenerateSemverTool,
    chmodcalc: ToolsGenerateChmodcalcTool,
    cnyamount: ToolsGenerateCnyamountTool,
    idvalidate: ToolsGenerateIdvalidateTool,
    datecalc: ToolsGenerateDatecalcTool,
    timezone: ToolsGenerateTimezoneTool,
    lorem: ToolsGenerateLoremTool,
    gitignore: ToolsGenerateGitignoreTool,
    corsgen: ToolsGenerateCorsgenTool,
    cachecontrol: ToolsGenerateCachecontrolTool,
    resratio: ToolsGenerateResratioTool,
    mediaquery: ToolsGenerateMediaqueryTool,
    cssclamp: ToolsGenerateCssclampTool,
    datamock: ToolsGenerateDatamockTool,
    javatimefmt: ToolsGenerateJavatimefmtTool,
    springbinding: ToolsGenerateSpringbindingTool,
    mavencoord: ToolsCodegenMavencoordTool,
    email: ToolsCodegenEmailTool,
    javastream: ToolsCodegenJavastreamTool,
    javabuilder: ToolsCodegenJavabuilderTool,
    beanval: ToolsCodegenBeanvalTool,
    jsontopojo: ToolsCodegenJsontopojoTool,
    json2ts: ToolsCodegenJson2tsTool,
    urlparser: ToolsDebugUrlparserTool,
    urlquery: ToolsDebugUrlqueryTool,
    cron: ToolsDebugCronTool,
    sqlbind: ToolsDebugSqlbindTool,
    stacktrace: ToolsDebugStacktraceTool,
    threaddump: ToolsDebugThreaddumpTool,
    httpstatus: ToolsReferenceHttpstatusTool,
    mimetype: ToolsReferenceMimetypeTool,
    httpheader: ToolsReferenceRefBrowseTool,
    ascii: ToolsReferenceRefBrowseTool,
    portref: ToolsReferenceRefBrowseTool,
    linux: ToolsReferenceRefBrowseTool,
    gitref: ToolsReferenceRefBrowseTool,
    regexref: ToolsReferenceRefBrowseTool,
    docker: ToolsReferenceRefBrowseTool,
    mavenref: ToolsReferenceRefBrowseTool,
    gradle: ToolsReferenceRefBrowseTool,
    jvmargs: ToolsReferenceRefBrowseTool,
    redisref: ToolsReferenceRefBrowseTool,
    mqref: ToolsReferenceRefBrowseTool,
    ideakeys: ToolsReferenceRefBrowseTool,
    designpatterns: ToolsReferenceRefBrowseTool,
    junit5: ToolsReferenceRefBrowseTool,
    cssref: ToolsReferenceRefBrowseTool,
    k8sref: ToolsReferenceRefBrowseTool,
    esref: ToolsReferenceRefBrowseTool,
    jdkfeatures: ToolsReferenceRefBrowseTool,
    gcref: ToolsReferenceRefBrowseTool,
    securityref: ToolsReferenceRefBrowseTool,
    springboot: ToolsReferenceRefBrowseTool,
    txpropagation: ToolsReferenceRefBrowseTool,
    mybatisplus: ToolsReferenceRefBrowseTool,
    mybatissql: ToolsReferenceRefBrowseTool,
    lombok: ToolsReferenceRefBrowseTool,
    jparef: ToolsReferenceRefBrowseTool,
    vuereactref: ToolsReferenceRefBrowseTool,
    arthas: ToolsReferenceRefBrowseTool,
    springcloud: ToolsReferenceRefBrowseTool,
    flowableref: ToolsReferenceRefBrowseTool,
    esdslref: ToolsReferenceRefBrowseTool,
    ip: ToolsDebugIpTool,
    cookiecache: ToolsDebugCookiecacheTool,
    logfmt: ToolsDebugLogfmtTool,
    logpattern: ToolsDebugLogpatternTool,
    traceheader: ToolsDebugTraceheaderTool,
    csselector: ToolsDebugCsselectorTool,
    specificity: ToolsDebugSpecificityTool,
    poolcalc: ToolsDebugPoolcalcTool,
    quartzcron: ToolsDebugQuartzcronTool,
    uaparser: ToolsDebugUaparserTool,
    nginxlog: ToolsDebugNginxlogTool,
    mybatissqllog: ToolsDebugMybatissqllogTool,
    regexjava: ToolsTextRegexjavaTool,
    diff: ToolsTextDiffTool,
    markdown: ToolsTextMarkdownTool,
    webfmt: ToolsFormatWebfmtTool,
    json2sql: ToolsFormatJson2sqlTool,
    jsonschema: ToolsFormatJsonschemaTool,
    imgbase64: ToolsEncodeImgbase64Tool,
    jwtgen: ToolsSecurityJwtgenTool,
    jwtverify: ToolsSecurityJwtverifyTool,
    webhooksig: ToolsSecurityWebhooksigTool,
    json2code: ToolsCodegenJson2codeTool,
    sqltopojo: ToolsCodegenSqltopojoTool,
    ddl2entity: ToolsCodegenDdl2entityTool,
    sql2mybatis: ToolsCodegenSql2mybatisTool,
    feigngen: ToolsCodegenFeigngenTool,
    flywaygen: ToolsCodegenFlywaygenTool,
    mapstruct: ToolsCodegenMapstructTool,
    entityconvert: ToolsCodegenEntityconvertTool,
    testgen: ToolsCodegenTestgenTool,
    jmh: ToolsCodegenJmhTool,
    jmhpro: ToolsCodegenJmhproTool,
    "hashext": ToolsSecurityHashextTool,
    "aes": ToolsSecurityAesTool,
    "jasypt": ToolsSecurityJasyptTool,
    "rsa": ToolsSecurityRsaTool,
    "bcrypt": ToolsSecurityBcryptTool,
    "gmsm": ToolsSecurityGmsmTool,
    "pbkdf2": ToolsSecurityPbkdf2Tool,
    "certparser": ToolsSecurityCertparserTool,
    "color": ToolsGenerateColorTool,
    "cssunit": ToolsGenerateCssunitTool,
    "boxshadow": ToolsGenerateBoxshadowTool,
    "gradient": ToolsGenerateGradientTool,
    "flexgrid": ToolsGenerateFlexgridTool,
    "cubicbezier": ToolsGenerateCubicbezierTool,
    "contrast": ToolsGenerateContrastTool,
    "svgopt": ToolsGenerateSvgoptTool,
    "favicon": ToolsGenerateFaviconTool,
    "fontpreview": ToolsGenerateFontpreviewTool,
    "image-compress": ToolsGenerateImageCompressTool,
    "imgshuffle": ToolsGenerateImgshuffleTool,
    "qrcode": ToolsTextQrcodeTool,
    "barcode": ToolsTextBarcodeTool,
    "htmlmd": ToolsTextHtmlmdTool,
    "toml": ToolsFormatTomlTool,
    "sqldialect": ToolsFormatSqldialectTool,
    "dbtype": ToolsFormatDbtypeTool,
    "xpath": ToolsFormatXpathTool,
    "sqlexplain": ToolsFormatSqlexplainTool,
    "javafmt": ToolsFormatJavafmtTool,
    "ddldiff": ToolsFormatDdldiffTool,
    "jsonexcel": ToolsFormatJsonexcelTool,
    "imgtopdf": ToolsFormatImgtopdfTool,
    "pdfmerge": ToolsFormatPdfmergeTool,
    "openapiview": ToolsFormatOpenapiviewTool,
    "protobuf": ToolsEncodeProtobufTool,
    "openapi2ts": ToolsCodegenOpenapi2tsTool,
    "plantuml": ToolsCodegenPlantumlTool,
    "ddlmermaid": ToolsCodegenDdlmermaidTool,
    "mermaid": ToolsCodegenMermaidTool,
    "ddl2crud": ToolsCodegenDdl2crudTool,
    "jsrun": ToolsCodegenJsrunTool,
    "htmlrun": ToolsCodegenHtmlrunTool,
    "pyrun": ToolsCodegenPyrunTool,
    "spel": ToolsDebugSpelTool,
    "ws": ToolsDebugWsTool,
    "stomp": ToolsDebugStompTool,
    "httpdebug": ToolsDebugHttpdebugTool,
    "grpc": ToolsDebugGrpcTool,
    "sse": ToolsDebugSseTool,
    "videodebug": ToolsDebugVideodebugTool,
    "mqtt": ToolsDebugMqttTool,
    "mappicker": ToolsDebugMappickerTool,
}

const rawId = String(route.params.id || '')
const resolvedId = resolveToolId(rawId)

if (!resolvedId) {
    throw createError({ statusCode: 404, statusMessage: '工具不存在' })
}

if (rawId !== resolvedId) {
    const query =
      rawId === 'base64' || rawId === 'base32'
        ? { algo: rawId }
        : rawId === 'qrdecode'
          ? { tab: 'decode' }
          : undefined
    await navigateTo(
      query ? { path: `/t/${resolvedId}`, query } : `/t/${resolvedId}`,
      { redirectCode: 301 },
    )
}

const tool = toolsById[resolvedId!]
if (!tool) {
    throw createError({ statusCode: 404, statusMessage: '工具不存在' })
}

const cat = getBusinessCategories().find((c) => c.id === tool.cat)
useToolSeo({ ...tool, catName: cat?.name })
const pageHeading = tool.name + ' 在线工具'
const faqUploadQ = tool.name + ' 会上传数据吗？'
/** 过宽标签不参与相关度（否则 generate 类几乎全员同分） */
const WEAK_TAGS = new Set(['common', 'frontend', 'backend'])
const RELATED_STOP = new Set(['生成', '工具', '在线', '转换', '计算', '解析', '格式', 'common'])

function buildRelatedList(current: typeof tool) {
    const tagSet = new Set((current.tags || []).filter((tag) => !WEAK_TAGS.has(tag)))
    const weakTagSet = new Set((current.tags || []).filter((tag) => WEAK_TAGS.has(tag)))
    const relatedTokens = (current.name + ' ' + (current.desc || '') + ' ' + current.id)
        .toLowerCase()
        .split(/[^a-z0-9\u4e00-\u9fff]+/)
        .filter((w) => w.length >= 2 && !RELATED_STOP.has(w))

    function keywordScore(t: { name: string; desc?: string; id: string }) {
        const hay = (t.name + ' ' + (t.desc || '') + ' ' + t.id).toLowerCase()
        let s = 0
        const seen = new Set<string>()
        for (const tok of relatedTokens) {
            if (seen.has(tok)) continue
            seen.add(tok)
            if (hay.includes(tok)) s += tok.length >= 4 ? 2 : 1
        }
        return s
    }

    function mix(id: string) {
        let h = 0
        const s = current.id + ':' + id
        for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
        return h
    }

    return tools
        .filter((t) => t.cat === current.cat && t.id !== current.id)
        .map((t) => {
            const strong = tagSet.size
                ? (t.tags || []).reduce((n, tag) => n + (tagSet.has(tag) ? 1 : 0), 0)
                : 0
            const weak = weakTagSet.size
                ? (t.tags || []).reduce((n, tag) => n + (weakTagSet.has(tag) ? 1 : 0), 0)
                : 0
            const kw = keywordScore(t)
            // 强标签优先；弱标签仅微调；关键词在弱/零交集时抬升；同分按当前工具打散
            const score = strong * 100 + kw * 10 + weak
            return { t, score, mix: mix(t.id) }
        })
        .sort((a, b) => b.score - a.score || a.mix - b.mix)
        .slice(0, 8)
        .map((x) => x.t)
}

/** SSR 算一次并注入 payload，避免 HMR/双端重算导致 related 顺序不一致 */
const related = useState(`tool-related:${tool.id}`, () => buildRelatedList(tool))

const { isFavorite, toggleFavorite, addRecent } = useToolHistory()
const favorited = computed(() => isFavorite(tool.id))
const { isDark, toggleTheme } = useTheme()

const VueTool = computed(() => {
    const id = resolveToolId(String(route.params.id || '')) || tool.id
    if (getToolImpl(id).kind !== 'vue') return null
    return vueToolComponents[id] || null
})

/**
 * 主区加载遮罩（自管挂载，不依赖 ClientOnly 卸 fallback 时机）：
 * - SSR / hydrate：只渲染静态骨架，工具组件不挂载
 * - onMounted：同一更新内打开绝对遮罩 + 挂载真实面板，避免空白中间帧
 * - 遮罩仅淡出、不淡入，防止半透明透出空白 I/O
 */
const panelReady = ref(false)
const panelLoading = ref(false)
let loadSeq = 0

async function showPanelMask() {
    if (!import.meta.client) return
    if (!VueTool.value) {
        panelLoading.value = false
        panelReady.value = true
        return
    }
    const seq = ++loadSeq
    panelLoading.value = true
    panelReady.value = true
    await nextTick()
    if (seq === loadSeq) panelLoading.value = false
}

onMounted(() => {
    addRecent(tool.id)
    showPanelMask()
})

onBeforeRouteUpdate(() => {
    showPanelMask()
})
</script>

<template>
  <div class="tool-page" :class="`cat-${tool.cat}`">
    <div class="tool-page__top">
      <nav class="breadcrumb" aria-label="面包屑">
        <NuxtLink to="/">首页</NuxtLink>
        <span class="sep">›</span>
        <NuxtLink v-if="cat" :to="`/c/${cat.id}`">{{ cat.name }}</NuxtLink>
        <span v-else>{{ tool.cat }}</span>
        <span class="sep">›</span>
        <span>{{ tool.name }}</span>
      </nav>
      <div class="tool-page__actions">
        <div class="tool-page__actions-inner">
          <button
            type="button"
            class="theme-btn"
            :aria-label="isDark ? '切换到浅色主题' : '切换到深色主题'"
            :title="isDark ? '切换到浅色' : '切换到深色'"
            @click="toggleTheme"
          >
            <svg v-if="isDark" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke-linecap="round" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" stroke-linejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            class="fav-btn"
            :class="{ 'is-on': favorited }"
            :aria-pressed="favorited"
            :title="favorited ? '取消收藏' : '收藏'"
            @click="toggleFavorite(tool.id)"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" :fill="favorited ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.8 6.6 20l1-6.1L3.2 9.4l6.1-.9L12 3z" stroke-linejoin="round" />
            </svg>
            {{ favorited ? '已收藏' : '收藏' }}
          </button>
        </div>
      </div>
    </div>
    <h1 class="sr-only">{{ pageHeading }}</h1>

    <div class="tool-layout">
      <div class="tool-layout__main">
        <template v-if="VueTool">
          <component
            :is="VueTool"
            v-if="panelReady"
            :key="tool.id"
          />
          <section
            v-else
            class="panel-mask panel-mask--static"
            aria-busy="true"
            aria-live="polite"
          >
            <div class="panel-mask__shell" aria-hidden="true">
              <div class="panel-mask__bar" />
              <div class="panel-mask__body">
                <div class="panel-mask__line panel-mask__line--lg" />
                <div class="panel-mask__line" />
                <div class="panel-mask__pane panel-mask__pane--main" />
              </div>
            </div>
            <div class="panel-mask__card">
              <div class="panel-mask__ring" aria-hidden="true" />
              <p class="panel-mask__title">正在加载交互面板</p>
              <p class="panel-mask__desc">{{ tool.name }} · 本地初始化中</p>
            </div>
          </section>
        </template>

        <section v-else class="migrating">
          <p class="migrating-title">该工具暂不可用</p>
          <p>
            <strong>{{ tool.name }}</strong>
            （<code>{{ tool.id }}</code>）面板尚未接入。
          </p>
        </section>

        <Transition name="panel-mask">
          <section
            v-if="panelLoading"
            class="panel-mask"
            aria-busy="true"
            aria-live="polite"
          >
            <div class="panel-mask__shell" aria-hidden="true">
              <div class="panel-mask__bar" />
              <div class="panel-mask__body">
                <div class="panel-mask__line panel-mask__line--lg" />
                <div class="panel-mask__line" />
                <div class="panel-mask__pane panel-mask__pane--main" />
              </div>
            </div>
            <div class="panel-mask__card">
              <div class="panel-mask__ring" aria-hidden="true" />
              <p class="panel-mask__title">正在加载交互面板</p>
              <p class="panel-mask__desc">{{ tool.name }} · 本地初始化中</p>
            </div>
          </section>
        </Transition>
      </div>

      <aside class="tool-layout__side" aria-label="辅助信息">
        <section class="faq" aria-labelledby="faq-title">
          <h2 id="faq-title">常见问题</h2>
          <details open>
            <summary>{{ faqUploadQ }}</summary>
            <p>不会。本工具在浏览器本地运行，服务端不做编解码，输入内容默认不出站。</p>
          </details>
          <details>
            <summary>是否需要安装或登录？</summary>
            <p>不需要。打开页面即可使用，免费、无账号门槛。</p>
          </details>
          <details>
            <summary>适合什么场景？</summary>
            <p>{{ tool.desc || `${tool.name} 日常开发调试与数据处理。` }}结果可直接复制使用。</p>
          </details>
        </section>

        <section v-if="related.length" class="related">
          <h2>相关工具</h2>
          <ul>
            <li v-for="t in related" :key="t.id">
              <NuxtLink :to="`/t/${t.id}`" :title="t.desc || t.name">
                <UiToolIcon :name="t.icon" size="sm" />
                <span>{{ t.name }}</span>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
.tool-page :deep(.ta:focus),
.tool-page :deep(input.inp:focus),
.tool-page :deep(select.sel:focus) {
  border-color: var(--cat-color, var(--brand));
  box-shadow: 0 0 0 3px var(--cat-glow, var(--brand-soft));
}
.tool-page :deep(.btn:not(.btn-ghost):not(.btn-danger)) {
  border-color: color-mix(in srgb, var(--cat-color, var(--brand)) 45%, var(--border));
}
.tool-page :deep(.btn:not(.btn-ghost):not(.btn-danger):hover) {
  border-color: var(--cat-color, var(--brand));
  box-shadow: 0 0 0 3px var(--cat-glow, var(--brand-soft));
}
.tool-page .breadcrumb a:hover {
  color: var(--cat-color, var(--brand));
}
.tool-page__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-shrink: 0;
}
.tool-page__top .breadcrumb {
  margin-bottom: 0;
}
.tool-page__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.tool-page__actions-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.theme-btn,
.fav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-soft);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.theme-btn {
  width: 32px;
  padding: 0;
  justify-content: center;
}
.fav-btn {
  padding: 0 12px;
}
.theme-btn:hover {
  border-color: color-mix(in srgb, var(--brand) 45%, var(--border));
  color: var(--brand);
  background: var(--brand-soft);
}
.fav-btn:hover {
  border-color: rgba(251, 191, 36, 0.45);
  color: #fde68a;
}
.fav-btn.is-on {
  border-color: rgba(251, 191, 36, 0.55);
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
}
.tool-page :deep(.tool-shell) {
  max-width: none;
}
.panel-mask {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: block;
  border-radius: calc(var(--radius) + 2px);
  border: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-card-from) 0%, var(--bg-card-to) 100%);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
}
.panel-mask--static {
  position: relative;
  inset: auto;
  width: 100%;
  height: 100%;
  min-height: 100%;
  flex: 1 1 auto;
}
/* 仅淡出：进入必须立即盖住，否则会透出空白 I/O */
.panel-mask-leave-active {
  transition: opacity 0.2s ease;
}
.panel-mask-leave-to {
  opacity: 0;
}
.panel-mask__shell {
  position: absolute;
  inset: 0;
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  pointer-events: none;
}
.panel-mask__bar {
  height: 42px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--bg-soft) 88%, transparent) 0%,
    color-mix(in srgb, var(--brand) 8%, var(--bg-soft)) 50%,
    color-mix(in srgb, var(--bg-soft) 88%, transparent) 100%
  );
  background-size: 200% 100%;
  animation: panel-shimmer 1.4s ease-in-out infinite;
}
.panel-mask__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.panel-mask__line {
  height: 36px;
  width: 72%;
  max-width: 520px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--bg-soft) 88%, transparent) 0%,
    color-mix(in srgb, var(--brand) 8%, var(--bg-soft)) 50%,
    color-mix(in srgb, var(--bg-soft) 88%, transparent) 100%
  );
  background-size: 200% 100%;
  animation: panel-shimmer 1.4s ease-in-out infinite;
}
.panel-mask__line--lg {
  width: 88%;
  max-width: 680px;
  height: 42px;
  animation-delay: 0.08s;
}
.panel-mask__pane {
  border-radius: 10px;
  border: 1px solid var(--border);
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--bg-input) 92%, transparent) 0%,
    color-mix(in srgb, var(--brand) 6%, var(--bg-input)) 50%,
    color-mix(in srgb, var(--bg-input) 92%, transparent) 100%
  );
  background-size: 200% 100%;
  animation: panel-shimmer 1.4s ease-in-out infinite;
}
.panel-mask__pane--main {
  flex: 1;
  min-height: 180px;
  animation-delay: 0.16s;
}
.panel-mask__card {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 220px;
  padding: 18px 22px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--brand) 28%, var(--border));
  background: color-mix(in srgb, var(--bg-elevated) 94%, transparent);
  box-shadow: var(--shadow);
  backdrop-filter: blur(12px);
  text-align: center;
}
.panel-mask__ring {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2.5px solid color-mix(in srgb, var(--brand) 22%, transparent);
  border-top-color: var(--brand);
  animation: panel-spin 0.75s linear infinite;
  margin-bottom: 2px;
}
.panel-mask__title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-strong);
}
.panel-mask__desc {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}
@keyframes panel-spin {
  to { transform: rotate(360deg); }
}
@keyframes panel-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.migrating {
  padding: 24px;
  background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius);
  color: var(--text-muted);
  margin-bottom: 16px;
  line-height: 1.6;
}
.migrating-title {
  margin: 0 0 8px;
  font-size: 1.05rem;
  color: var(--warning);
  font-weight: 650;
}
.tool-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 260px);
  gap: 14px;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  height: auto;
  overflow: hidden;
}
.tool-layout__main {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.tool-layout__main > :deep(.tool-shell),
.tool-layout__main > :deep(.panel-mask),
.tool-layout__main > .migrating {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}
.tool-layout__main > :deep(div) {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tool-layout__side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
  height: 100%;
}
.faq,
.related {
  margin: 0;
  padding: 14px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
}
.related {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.faq h2,
.related h2 {
  margin: 0 0 10px;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text);
}
.faq details {
  padding: 12px 0;
  border-top: 1px solid rgba(36, 48, 68, 0.85);
}
.faq details:first-of-type {
  border-top: none;
  padding-top: 0;
}
.faq summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--text-strong);
  font-size: 0.84rem;
  line-height: 1.4;
}
.faq p {
  margin: 6px 0 0;
  color: var(--text-muted);
  line-height: 1.5;
  font-size: 0.8rem;
}
.related ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
.related a {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 7px 10px;
  border-radius: 8px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  color: var(--text);
  text-decoration: none;
  font-size: 0.82rem;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.related a span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.related a:hover {
  border-color: var(--brand);
  color: #7dd3fc;
  background: var(--brand-soft);
}
@media (max-width: 1100px) {
  .tool-page {
    height: auto;
    overflow: visible;
  }
  .tool-layout {
    grid-template-columns: 1fr;
    flex: none;
    height: auto;
    min-height: 0;
    overflow: visible;
  }
  .tool-layout__main {
    min-height: min(560px, 70vh);
  }
  .tool-layout__side {
    height: auto;
  }
  .related {
    flex: none;
  }
  .related ul {
    flex-direction: row;
    flex-wrap: wrap;
    overflow: visible;
  }
  .related a {
    width: auto;
  }
}
</style>
