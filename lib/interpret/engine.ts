/**
 * 规则解读引擎 —— 基于公有领域古籍的确定性命理论断
 *
 * 内容来源：《骨髓赋》《紫微斗数全集》《紫微斗数全书》（均为明代刊本，公有领域）
 * 明确排除：倪海厦《天纪》原话（CC BY-NC-SA 4.0）
 *
 * 设计原则（对齐技术规格 §5.1）：
 * - 引擎不做任何天文计算，只读取排盘引擎已算好的结构化数据
 * - 每条论断可回溯到具体星曜/宫位/四化，不臆造
 * - 数据缺失时明确说明，不猜测
 * - 零 API Key、零成本、命盘数据不出服务器
 */

import type { ZiweiChart, Palace, Star, SiHua } from '@/lib/ziwei/types';
import { BRANCHES } from '@/lib/ziwei/constants';
import { retrieveKnowledge } from '@/lib/classics/knowledge-base';

// ─── 主星本性（14 主星） ─────────────────────────────────────────────────────

type StarNature = {
  /** 一句话定性 */
  nature: string;
  /** 化气与五行 */
  element: string;
  /** 核心特质 */
  traits: string[];
  /** 优点 */
  strength: string;
  /** 课题 */
  challenge: string;
  /** 适宜方向 */
  suitable: string[];
};

export const STAR_NATURE: Record<string, StarNature> = {
  紫微: {
    nature: '帝座之星，尊贵统领，喜辅弼昌曲来朝。',
    element: '属土，化气为尊',
    traits: ['格局高', '自尊心强', '有领导欲', '好面子', '喜受人敬重'],
    strength: '天生有统筹全局的眼光与压得住场的气势，做事要求完备，不甘居人下。',
    challenge: '紫微最忌「孤君无辅」——若无左辅右弼、文昌文曲会照，纵贵不久，易流于刚愎、眼高手低。',
    suitable: ['管理', '公职高层', '组织领导', '平台型事业'],
  },
  天机: {
    nature: '智慧之星，善谋多变，主机动与策划。',
    element: '属木，化气为善',
    traits: ['思维敏捷', '善于规划', '反应快', '多虑', '易变'],
    strength: '头脑灵活，擅长在复杂局面里找出路，咨询、策划、文教类工作事半功倍。',
    challenge: '最忌「善变无主」——想法多而落地少，需昌曲会照或煞星激发方能成器。',
    suitable: ['咨询策划', '文教', '技术分析', '幕僚参谋'],
  },
  太阳: {
    nature: '贵星，主名誉、公务、博爱，喜庙旺。',
    element: '属火，化气为贵',
    traits: ['光明磊落', '好施与', '重名声', '劳心', '闲不住'],
    strength: '庙旺（卯辰巳午）主大贵，为人敞亮、有公信力，适合抛头露面、承担公共角色。',
    challenge: '落陷（戌亥子丑）则劳而无获，付出多、回报少，易为面子硬撑。',
    suitable: ['公务', '传媒', '教育', '对外事务', '公益'],
  },
  武曲: {
    nature: '财星之主，刚毅果决，善理财经营。',
    element: '属金，化气为财',
    traits: ['果断', '务实', '重财', '性刚', '寡合'],
    strength: '天生对钱敏感，执行力强，宜金融、实业、技术，能靠硬本事积累财富。',
    challenge: '性过刚则易折，须留意身体与意外风险；最忌化忌，见之主手术血光、金属意外。',
    suitable: ['金融财务', '实业经营', '军警武职', '技术专精'],
  },
  天同: {
    nature: '福星，主温和、知足、享乐，亦主感情丰富。',
    element: '属水，化气为福',
    traits: ['随和', '重感受', '懒散', '有人缘', '抗压弱'],
    strength: '性情宽厚不与人争，一生多得顺境照拂，能把日子过得有滋味。',
    challenge: '太安逸则失进取，遇煞易情绪化；需大限流年激发才有冲劲。',
    suitable: ['服务', '文创', '福利', '协调类工作'],
  },
  廉贞: {
    nature: '次桃花星，文武兼备，主囚亦主情。',
    element: '属火属木，化气为囚',
    traits: ['多才', '感情浓烈', '有手段', '不服输', '易走极端'],
    strength: '能力全面、有魄力有手腕，宜公门、宜专业技术，能在约束中做出成绩。',
    challenge: '情绪与约束是毕生功课；最忌化忌，见之主血光官非与感情纠纷。',
    suitable: ['公务司法', '专业技术', '公关外交', '文艺'],
  },
  破军: {
    nature: '耗星，主开创、变动、先破后立。',
    element: '属水，化气为耗',
    traits: ['敢闯', '不守成', '六亲缘薄', '消耗大', '有魄力'],
    strength: '敢推倒重来，适合开创性、技术性走天下的路，破而后立能成大事。',
    challenge: '一生变动多、耗损大，早年易起伏；需先有专长再谈创业。',
    suitable: ['创业开创', '技术专长', '业务拓展', '军警'],
  },
  天府: {
    nature: '令星、禄库之主，主稳重、包容、衣食无忧。',
    element: '属土，南斗令星',
    traits: ['稳健', '善守成', '有度量', '保守', '重实际'],
    strength: '天生会管钱管物，品行端正，宜守成、宜管理，一生少大起大落。',
    challenge: '过于保守则错失机会；最喜见禄存成「双禄朝垣」，无禄则库空。',
    suitable: ['财务管理', '行政主管', '仓储物流', '稳定平台'],
  },
  太阴: {
    nature: '中天主星，主田宅、财富、内蕴，庙旺最吉。',
    element: '属水，中天主星',
    traits: ['细腻', '有计划', '重家', '内敛', '易多愁'],
    strength: '在亥子庙旺主大富，善理财置产，心思周密，女命尤吉主貌美贤淑。',
    challenge: '在午未落陷则主劳碌奔波，情绪易起伏，宜静不宜动。',
    suitable: ['财务不动产', '艺术设计', '研究', '内务管理'],
  },
  贪狼: {
    nature: '桃花欲望之星，主多才、社交、机遇。',
    element: '属木属水',
    traits: ['多才多艺', '善交际', '欲望强', '机会多', '易分心'],
    strength: '人缘与机会最多的一颗星，逢火星成「火贪格」、逢铃星成「铃贪格」，主偏财横发。',
    challenge: '最忌空劫，主华而不实；兴趣太广则样样通样样松。',
    suitable: ['业务销售', '演艺娱乐', '餐饮', '公关', '玄学艺术'],
  },
  巨门: {
    nature: '暗星，主口舌、思辨、是非，亦主口才。',
    element: '属水，化气为暗',
    traits: ['善辩', '观察细', '多疑', '口才好', '易招是非'],
    strength: '「以口生财」，靠表达、思辨、专业服务取酬，宜律师、教师、传媒、咨询。',
    challenge: '最忌化忌，见之口舌官非不断；与太阳同宫于丑未称「日月反背」，是非更重。',
    suitable: ['法律', '教育', '传媒', '咨询', '学术研究'],
  },
  天相: {
    nature: '印星，辅佐之星，主忠厚、服务、守分。',
    element: '属水，化气为印',
    traits: ['尽责', '重信用', '有服务心', '依赖强', '不擅开创'],
    strength: '最好的二把手，行政、秘书、法务类工作能做到让人放心。',
    challenge: '不喜独坐，须借紫微或廉贞威仪方能成事；见煞则「印」破，易受牵连。',
    suitable: ['行政法务', '秘书幕僚', '服务管理', '辅佐岗位'],
  },
  天梁: {
    nature: '荫星，主慈悲、化解、孤克，老人星。',
    element: '属土，化气为荫',
    traits: ['成熟', '爱照顾人', '清高', '逢凶化吉', '易操心'],
    strength: '一生遇难呈祥，宜法律、医学、教育、宗教——靠专业与资历累积声望。',
    challenge: '最喜见化科以立清名，化禄反主虚浮；孤克之气易使六亲缘淡。',
    suitable: ['医疗', '法律', '教育', '宗教哲学', '监察'],
  },
  七杀: {
    nature: '将星，性刚毅果决，主肃杀与独当一面。',
    element: '南斗第六星，属金火',
    traits: ['刚毅', '独立', '冲动', '有担当', '不喜束缚'],
    strength: '若居子午寅申成「七杀朝斗格」，对宫紫微天府相照，主爵禄荣昌，最宜军警武职、开疆拓土。',
    challenge: '不喜与诸吉同宫，独行其道方为本格；逢空劫主孤独漂泊，逢化忌反主消沉。',
    suitable: ['军警武职', '外科医生', '创业开拓', '高管'],
  },
};

// ─── 主星 × 领域侧重 ─────────────────────────────────────────────────────────

const STAR_WEALTH: Record<string, string> = {
  紫微: '财源多来自大平台、高职级或组织资源，属「官财」性质，宜走管理位、靠格局取财。',
  天机: '财从动脑、策划、多方周转而来，宜技术入股或咨询取酬，忌死守单一来源。',
  太阳: '财随名声与公务而来，付出型生财，越公开、越被信任，回报越稳；落陷则劳而少获。',
  武曲: '正财最强的一颗星，靠专业能力与经营硬本事积累，宜金融实业；忌投机与担保。',
  天同: '财来得不算猛烈，胜在细水长流、有福气照应；宜稳定薪酬，不宜高风险搏杀。',
  廉贞: '财路偏「竞争型」，靠手腕与专业在博弈中取得；须防因情绪或法律问题破财。',
  破军: '先破后立之财，常是一次大投入换一次大台阶；须有专长托底，否则耗大于得。',
  天府: '会赚更会守，财库观念强，宜储蓄、不动产、稳健配置，一生少缺钱。',
  太阴: '财与田宅绑定，善置产、善累积，越到中后段越见厚度；庙旺主大富。',
  贪狼: '偏财、横财机会最多，人缘即财缘；逢火铃主爆发，逢空劫则华而不实。',
  巨门: '「以口生财」，靠表达、思辨、专业服务取酬；化禄则财源活，化忌则因言招损。',
  天相: '财随职位与信用而来，宜在成熟平台内稳步累积，不宜自立门户硬拼。',
  天梁: '财从资历、专业与清望而来，属「慢富」，越老越值钱；不宜急功近利。',
  七杀: '财靠拼抢与开拓得来，起伏大、来得猛；须防一冲而过，宜设止损。',
};

const STAR_CAREER: Record<string, string> = {
  紫微: '宜在大平台担任统筹或领导角色，格局决定成就；平台小则委屈。',
  天机: '宜策划、咨询、技术分析、文教等动脑岗位，越复杂越显本事。',
  太阳: '宜公务、传媒、教育、对外事务等需公信力的角色，庙旺主大贵。',
  武曲: '宜金融、实业、军警、技术专精，靠硬本事立身，适合独当一面的执行位。',
  天同: '宜服务、文创、福利、协调类岗位，环境和谐则发挥最好。',
  廉贞: '宜公门、司法、专业技术、公关外交，在规则与压力中反能出成绩。',
  破军: '宜开创、技术走天下、业务拓展，稳定守成的岗位会压抑其能量。',
  天府: '宜财务、行政主管、仓储管理等守成型岗位，是组织里最稳的底盘。',
  太阴: '宜财务、不动产、艺术设计、研究等需细腻与耐心的工作。',
  贪狼: '宜业务、演艺、餐饮、公关、玄学艺术，靠人脉与才艺打开局面。',
  巨门: '宜法律、教育、传媒、咨询、学术研究，靠嘴与脑子吃饭最对路。',
  天相: '宜行政、法务、秘书、辅佐类岗位，是最好的二把手人选。',
  天梁: '宜医疗、法律、教育、宗教、监察，靠专业与资历累积声望。',
  七杀: '宜军警、外科、创业开拓、高管，需独当一面、有压力的岗位才成器。',
};

const STAR_LOVE: Record<string, string> = {
  紫微: '配偶端庄有气质、格局不低，但宜迟婚不宜早——早婚易因个性都强而生摩擦。',
  天机: '感情中重精神交流，想法多、易犹豫；宜找能定方向的伴侣，避免反复消耗。',
  太阳: '为感情付出多、爱面子也爱照顾人；庙旺则配偶贤达，落陷易劳心不被领情。',
  武曲: '感情偏务实、话不多，刚直易冷；宜迟婚，早婚易因个性硬碰硬。',
  天同: '感情细腻重感受，易依赖也易心软；宜找有主见的伴侣互补。',
  廉贞: '感情浓烈、故事多，是次桃花星；须慎防情绪用事与第三者议题。',
  破军: '感情多变动、易轰轰烈烈亦易断然收场；宜晚婚、宜找能一起开创的人。',
  天府: '感情稳定、重家庭责任，配偶务实可靠；略显平淡但经得起时间。',
  太阴: '感情细腻长情，重家与安全感；庙旺主配偶贤美，落陷易多愁敏感。',
  贪狼: '桃花最重的星之一，异性缘佳、选择多；须防花多眼乱，见火铃反主激情。',
  巨门: '感情易因沟通与猜疑生波折；化禄则言笑和解，化忌则口舌不断。',
  天相: '重承诺、讲信用，配偶多为可靠之人；但易受外界影响，须有主见。',
  天梁: '配偶多成熟稳重、年纪或心态偏长，有照顾缘；略显孤克，宜多表达温度。',
  七杀: '感情来得快、个性强，易一见钟情亦易骤冷；宜迟婚、宜找能包容刚直的人。',
};

// ─── 四化含义 ────────────────────────────────────────────────────────────────

const SIHUA_IN_PALACE: Record<SiHua, Record<string, string>> = {
  禄: {
    命宫: '化禄入命，财源与缘分俱旺，能力容易变现，一生多顺境。',
    财帛: '化禄入财帛，正财稳定、财来财往，是能把能力换成钱的配置。',
    官禄: '化禄入官禄，事业与财路相应，职场上有资源、有回报。',
    夫妻: '化禄入夫妻，婚姻甜蜜，配偶能带来实质助力。',
    迁移: '化禄入迁移，外出得财、人缘广，离乡发展反有天地。',
    田宅: '化禄入田宅，置产顺利、家宅兴旺，财能落到实物上。',
    福德: '化禄入福德，精神享受丰、想得开，是内心有福的配置。',
    子女: '化禄入子女，子女缘佳、下属得力，亦主桃花与创意成果。',
    疾厄: '化禄入疾厄，体质底子不差，但易因安逸而疏忽，须防发胖与饮食过度。',
    父母: '化禄入父母，与长辈缘分好，亦主文书、合约顺利。',
    兄弟: '化禄入兄弟，手足合伙可得力，资金往来顺畅。',
    仆役: '化禄入仆役，朋友圈能带来机会与资源，贵人在人堆里。',
  },
  权: {
    命宫: '化权入命，能担大任、有决断，一生宜独当一面。',
    财帛: '化权入财帛，对钱有掌控力，敢做大的资金决策，须防过度扩张。',
    官禄: '化权入官禄，事业上有掌控力，宜走管理或技术权威路线。',
    夫妻: '化权入夫妻，配偶个性强、家里需分工，宜互让不宜争主导。',
    迁移: '化权入迁移，在外有话语权、能开创局面，适合外派或自立门户。',
    田宅: '化权入田宅，家宅大事自己拍板，置产有魄力。',
    福德: '化权入福德，想法坚定、有主见，但也易钻牛角尖。',
    子女: '化权入子女，对子女与下属管得严，宜平等不宜高压。',
    疾厄: '化权入疾厄，身体意志强、扛得住，但易硬撑忽略警讯。',
    父母: '化权入父母，长辈较强势，或自己与上级关系需拿捏分寸。',
    兄弟: '化权入兄弟，手足合伙易争主导，须先讲清权责。',
    仆役: '化权入仆役，朋友圈中是主导者，亦须防下属强势。',
  },
  科: {
    命宫: '化科入命，名声远播、气质清雅，遇困多有贵人解。',
    财帛: '化科入财帛，财随名声而来，宜以专业信誉取酬。',
    官禄: '化科入官禄，事业上以专业与口碑立足，宜文教研究咨询。',
    夫妻: '化科入夫妻，配偶有教养、重体面，感情偏理性温和。',
    迁移: '化科入迁移，在外有好名声、易得贵人提携。',
    田宅: '化科入田宅，家宅清雅，置产过程顺遂。',
    福德: '化科入福德，精神生活有品位，喜读书思考。',
    子女: '化科入子女，子女聪颖有出息，宜教养并重。',
    疾厄: '化科入疾厄，遇病易遇好医生，恢复力尚可。',
    父母: '化科入父母，与长辈有文书之缘，学业多得提携。',
    兄弟: '化科入兄弟，手足间讲情理，合伙较省心。',
    仆役: '化科入仆役，朋友多为良善有身份之人。',
  },
  忌: {
    命宫: '化忌入命，一生有「钝点」，是最深的功课——过了就是大智慧。三十岁前后最锋利。',
    财帛: '化忌入财帛，财来财去、易有资金压力，须严控负债与担保。',
    官禄: '化忌入官禄，职场多波折，但磨练后反成专业人才；宜沉不宜跳。',
    夫妻: '化忌入夫妻，婚姻多磨砺，须正视沟通与期待落差，忌逃避。',
    迁移: '化忌入迁移，外出多阻碍，宜先稳内再图外。',
    田宅: '化忌入田宅，家宅不宁或置产生波折，须留意合约细节。',
    福德: '化忌入福德，内心易不安、想得多，须主动调节精神状态。',
    子女: '化忌入子女，子女缘偏薄或亲子易摩擦，宜多陪伴少施压。',
    疾厄: '化忌入疾厄，是身体的罩门所在，须针对性保养并定期检查。',
    父母: '化忌入父母，与长辈或上级易有心结，文书契约须谨慎。',
    兄弟: '化忌入兄弟，手足合伙易生嫌隙，财务往来要留凭证。',
    仆役: '化忌入仆役，须防朋友拖累、小人耗损，宜精简社交圈。',
  },
};

// ─── 宫位含义 ────────────────────────────────────────────────────────────────

const PALACE_ROLE: Record<string, string> = {
  命宫: '一生格局的根本，定气质、定高度',
  兄弟宫: '手足关系、合伙与资金往来',
  夫妻宫: '配偶气质、婚姻状态与感情模式',
  子女宫: '子女缘分、下属、桃花与创意成果',
  财帛宫: '财源方式、收入结构与理财风格',
  疾厄宫: '身体底子、先天罩门与意外风险',
  迁移宫: '外出机遇、社会面的人际格局',
  仆役宫: '朋友圈、贵人与小人',
  交友宫: '朋友圈、贵人与小人',
  官禄宫: '事业方向、社会成就与职位高度',
  田宅宫: '不动产、家庭环境与财库归藏',
  福德宫: '精神享受、内心状态与兴趣所在',
  父母宫: '父母长辈、文书契约与上司缘分',
};

// ─── 格局名称（用于识别后取意） ──────────────────────────────────────────────

const PATTERN_TEXT: Record<string, string> = {
  紫府同宫: '紫微天府同入命宫，品行端正、衣食无忧、有领导才能；需左右辅弼配合方为完整大格。',
  七杀朝斗: '七杀居子午寅申坐命、对宫紫微天府相照，主爵禄荣昌，最宜军警武职或企业高管。',
  杀破狼: '七杀、破军、贪狼会于命迁财官，一生变动多、不甘平凡，宜创业、军警、业务；中年后方稳。',
  机月同梁: '天机、太阴、天同、天梁入命迁财官，文质彬彬、聪慧善谋，最宜公职、学术、文艺、医疗等稳定累积型行业。',
  双禄朝垣: '化禄与禄存同会命宫三方四正，古云「富比陶朱」，一生不愁财；最忌空劫来冲。',
  君臣庆会: '紫微得左右辅弼会照夹持，主贵而有实权，是能成事的领导格。',
  火贪格: '贪狼与火星同宫或对照，主偏财横发、机遇爆发，一生易有意外之得。',
  铃贪格: '贪狼与铃星同宫或对照，亦主横发，惟爆发较缓、须待时机。',
  日月同宫: '太阳太阴同入丑或未宫，异性缘佳、事业顺遂、名声远播。',
  武曲七杀: '武曲与七杀同宫于丑未，刚直武贵，财与魄力并见，宜专业硬技术路线。',
};

// ─── 引擎主体 ────────────────────────────────────────────────────────────────

export type TopicKey = 'overview' | 'personality' | 'love' | 'career' | 'wealth' | 'health';

const TOPIC_TO_PALACE: Record<TopicKey, string> = {
  overview: '命宫',
  personality: '命宫',
  love: '夫妻',
  career: '官禄',
  wealth: '财帛',
  health: '疾厄',
};

/** 宫位在 chart.palaces 里的 name 只有命宫带「宫」，展示时统一补上 */
const palaceLabel = (key: string) => (key.endsWith('宫') ? key : `${key}宫`);

export interface InterpretOptions {
  /** 用户追问原文（用于关键词补充） */
  question?: string;
  /** 语言，暂只支持 zh */
  language?: 'zh' | 'en';
}

/** 取某宫主星描述（空宫则借对宫并说明） */
function palaceStarsDesc(p: Palace): { names: string[]; labels: string[]; borrowed: boolean } {
  const majors = p.stars.filter(s => s.type === 'major');
  if (majors.length > 0) {
    return { names: majors.map(s => s.name), labels: majors.map(starLabel), borrowed: false };
  }
  if (p.borrowedStars?.length) {
    return { names: p.borrowedStars, labels: p.borrowedStars, borrowed: true };
  }
  return { names: [], labels: [], borrowed: false };
}

/** 三方四正的一行描述：本宫有星则列星，空宫则说明借自何宫 */
function tripleLine(p: Palace): string {
  const s = palaceStarsDesc(p);
  const from = p.borrowedFromName ? palaceLabel(p.borrowedFromName) : '对宫';
  const body = s.borrowed
    ? `空宫，借对宫${from}的 ${s.labels.join('、')}`
    : s.labels.length ? s.labels.join('、') : '空宫';
  return `· ${palaceLabel(p.name)}（${BRANCHES[p.branch]}）：${body}`;
}

/** 主星 + 四化 + 亮度 的紧凑标注 */
function starLabel(star: Star): string {
  let t = star.name;
  if (star.siHua) t += `化${star.siHua}`;
  if (star.brightnessRaw) t += `（${star.brightnessRaw}）`;
  return t;
}

/** 找出某宫内的四化 */
function palaceSihua(p: Palace): Array<{ star: Star; hua: SiHua }> {
  return p.stars
    .filter(s => !!s.siHua)
    .map(s => ({ star: s, hua: s.siHua as SiHua }));
}

/** 三方四正（命宫视角：本宫 + 对宫 + 两个三合宫） */
function tripleAndSquare(chart: ZiweiChart, palace: Palace): Palace[] {
  const b = palace.branch;
  const idx = (x: number) => chart.palaces.find(p => p.branch === x)!;
  return [palace, idx((b + 6) % 12), idx((b + 4) % 12), idx((b + 8) % 12)].filter(Boolean);
}

/** 检测命盘中的已知格局（基于星曜位置，不依赖 patterns.ts 的服务端模块） */
function detectPatterns(chart: ZiweiChart): string[] {
  const found: string[] = [];
  const ming = chart.palaces.find(p => p.name === '命宫');
  if (!ming) return found;

  const mingMajors = ming.stars.filter(s => s.type === 'major').map(s => s.name);
  const triple = tripleAndSquare(chart, ming);
  const tripleStars = triple.flatMap(p => p.stars.filter(s => s.type === 'major').map(s => s.name));
  const has = (n: string) => mingMajors.includes(n);
  const inTriple = (n: string) => tripleStars.includes(n);

  // 紫府同宫
  if (has('紫微') && has('天府')) found.push('紫府同宫');
  // 七杀朝斗：七杀坐命于子午寅申
  if (has('七杀') && [0, 6, 2, 8].includes(ming.branch)) found.push('七杀朝斗');
  // 杀破狼：命宫七杀/破军/贪狼，且三方见另外两者
  if ((has('七杀') || has('破军') || has('贪狼'))) {
    const others = ['七杀', '破军', '贪狼'].filter(n => !has(n));
    if (others.every(inTriple)) found.push('杀破狼');
  }
  // 机月同梁
  if (['天机', '太阴', '天同', '天梁'].filter(n => inTriple(n) || has(n)).length >= 4) found.push('机月同梁');
  // 武曲七杀
  if (has('武曲') && has('七杀')) found.push('武曲七杀');
  // 日月同宫
  if (has('太阳') && has('太阴')) found.push('日月同宫');
  // 火贪 / 铃贪
  const mingSha = ming.stars.map(s => s.name);
  if (has('贪狼') && (mingSha.includes('火星') || triple.some(p => p.stars.some(s => s.name === '火星')))) found.push('火贪格');
  if (has('贪狼') && (mingSha.includes('铃星') || triple.some(p => p.stars.some(s => s.name === '铃星')))) found.push('铃贪格');
  // 双禄朝垣：命宫三方见化禄 + 禄存
  const tripleAll = triple.flatMap(p => p.stars);
  if (tripleAll.some(s => s.siHua === '禄') && tripleAll.some(s => s.name === '禄存')) found.push('双禄朝垣');
  // 君臣庆会：紫微坐命 + 三方见左辅或右弼
  if (has('紫微') && (inTriple('左辅') || inTriple('右弼'))) found.push('君臣庆会');

  return [...new Set(found)];
}

/** 当前大限描述 */
function currentDaXian(chart: ZiweiChart): string {
  const dx = chart.daXians[chart.currentDaXianIndex];
  if (!dx) return '当前大限信息未提供。';
  const palace = chart.palaces.find(p => p.name === dx.palaceName);
  const majors = palace ? palaceStarsDesc(palace).names : [];
  const stem = dx.stemName ? `，大限天干${dx.stemName}带动新一轮四化` : '';
  const stars = majors.length ? `该限走【${majors.join('、')}】主星的宫位，` : '';
  return `现行大限 ${dx.startAge}–${dx.endAge} 岁，行经【${palaceLabel(dx.palaceName)}】${stem}。${stars}这十年的主旋律由该宫所主之事决定。`;
}

/** 古籍引证块 */
function classicsBlock(stars: string[], sihuas: string[], palaces: string[]): string {
  const k = retrieveKnowledge({ stars, sihuas, palaces, maxPassages: 3 });
  if (k.passages.length === 0) return '';
  const lines = k.passages.map(p => `> ${p.text}——《${p.bookTitle}·${p.chapterTitle}》`);
  return `\n**【古籍印证】**\n${lines.join('\n\n')}`;
}

/** 统一收尾 */
const TAIL = '\n**【提醒】**\n命理属传统文化参考，人生际遇由自身选择、努力与环境共同决定，宜积极面对，不宜据此做重大决策。';

// ─── 单宫解读（主题与宫位点击共用） ──────────────────────────────────────────

type Domain = 'love' | 'career' | 'wealth' | 'health' | 'generic';

const DOMAIN_WORD: Record<Domain, string> = {
  love: '感情', career: '事业', wealth: '财帛', health: '身体', generic: '',
};

const DOMAIN_TITLE: Record<Domain, string> = {
  love: '感情格局', career: '事业格局', wealth: '财运格局', health: '健康格局', generic: '',
};

function palaceSection(chart: ZiweiChart, palaceKey: string, domain: Domain): string[] {
  const out: string[] = [];
  const palace = chart.palaces.find(p => p.name === palaceKey);
  const palaceName = palaceLabel(palaceKey);
  if (!palace) {
    out.push(`**【${palaceName}】**\n当前命盘未提供${palaceName}数据，此处不作臆断。`);
    return out;
  }

  const { names, labels, borrowed } = palaceStarsDesc(palace);
  const mainStar = names[0];
  const nature = STAR_NATURE[mainStar];
  const domainText = domain === 'love' ? STAR_LOVE : domain === 'career' ? STAR_CAREER : domain === 'wealth' ? STAR_WEALTH : null;
  const role = PALACE_ROLE[palaceName];
  const borrowedFrom = palace.borrowedFromName ? palaceLabel(palace.borrowedFromName) : '对宫';
  const topicWord = DOMAIN_WORD[domain] || palaceName.replace('宫', '');

  out.push(
    domain === 'generic'
      ? `**【${palaceName}】**`
      : `**【${DOMAIN_TITLE[domain]}】**`
  );
  if (role) out.push(`${palaceName}主${role}。`);

  if (!nature) {
    out.push(`${palaceName}主星数据未提供，此处不作臆断。`);
  } else {
    out.push(
      borrowed
        ? `${palaceName}无主星，借对宫${borrowedFrom}的【${names.join('、')}】论${topicWord}。${domainText?.[mainStar] ?? nature.nature}借宫而论，此项与外界环境联动更强。`
        : `${labels.join('、')}入${palaceName}（${BRANCHES[palace.branch]}宫）。${nature.nature}${domainText?.[mainStar] ?? ''}`
    );
  }

  if (domain === 'health') {
    out.push(`\n**【疾厄宫星曜】**`);
    const allStars = palace.stars.map(starLabel);
    out.push(allStars.length ? `${palaceName}见：${allStars.join('、')}。` : `${palaceName}无星曜记录。`);
    if (nature) out.push(`以【${mainStar}】论，先天体质倾向：${nature.element}，${nature.challenge}`);
    const ji = palaceSihua(palace).find(x => x.hua === '忌');
    out.push(
      ji
        ? `\n该宫见**${ji.star.name}化忌**，是身体最需要长期照看的部位，建议定期体检、勿硬撑。`
        : `\n该宫未见化忌，先天底子相对从容，仍须依大限流年留意阶段性消耗。`
    );
  } else {
    out.push(`\n**【宫位依据】**`);
    const allStars = palace.stars.map(starLabel);
    out.push(`${palaceName}（${BRANCHES[palace.branch]}）星曜：${allStars.length ? allStars.join('、') : '空宫'}。`);
    const selfHua = palace.selfSihua ?? [];
    if (selfHua.length) {
      out.push(`宫干自化：${selfHua.map(s => `${s.starName}化${s.siHua}`).join('、')}——此项能量易主动外散，须留意留不住。`);
    }
  }

  out.push(`\n**【三方联动】**`);
  out.push(tripleAndSquare(chart, palace).filter(p => p.name !== palaceKey).map(tripleLine).join('\n'));

  const palaceHua = palaceSihua(palace);
  if (palaceHua.length) {
    out.push(`\n**【四化入宫】**`);
    out.push(
      palaceHua
        .map(x => `· ${x.star.name}化${x.hua}入${palaceName}${SIHUA_IN_PALACE[x.hua][palaceKey] ? `：${SIHUA_IN_PALACE[x.hua][palaceKey]}` : '。'}`)
        .join('\n')
    );
  }

  out.push(`\n**【当前大限】**`);
  out.push(currentDaXian(chart));

  const adviceTitle =
    domain === 'love' ? '【相处建议】' :
    domain === 'career' ? '【方向建议】' :
    domain === 'wealth' ? '【理财建议】' :
    domain === 'health' ? '【调养建议】' : `【${palaceName}建议】`;
  out.push(`\n**${adviceTitle}**`);
  if (nature) {
    const advice =
      domain === 'love'
        ? `以【${mainStar}】的感情模式，宜找能补其所短的伴侣：${nature.suitable.slice(0, 2).join('、')}背景或性格成熟度相当者更稳。${nature.challenge}`
        : domain === 'career'
        ? `适宜方向：${nature.suitable.join('、')}。${nature.strength}`
        : domain === 'wealth'
        ? `取财方式应贴合【${mainStar}】的本性，${nature.strength}同时${nature.challenge}`
        : domain === 'health'
        ? `顺其${nature.element.split('，')[0]}之性调养，避免长期透支；${nature.challenge}`
        : `${palaceName}既以【${mainStar}】为主，宜顺着「${nature.strength.replace(/。$/, '')}」这条线经营，${nature.challenge}`;
    out.push(advice);
  } else {
    out.push('因主星数据缺失，此处仅建议：以稳为主，重大决定前多收集事实依据，勿凭一时情绪。');
  }

  out.push(classicsBlock(names, palaceHua.map(x => `化${x.hua}`), [palaceName]));
  return out;
}

// ─── 主题解读生成 ────────────────────────────────────────────────────────────

/** 主题 → 段落数组（不含免责收尾） */
function topicSections(chart: ZiweiChart, topic: TopicKey): string[] {
  const out: string[] = [];
  const ming = chart.palaces.find(p => p.name === '命宫');
  if (!ming) return ['当前命盘缺少命宫数据，无法解读。'];
  const mingStars = palaceStarsDesc(ming);

  switch (topic) {
    case 'overview':
    case 'personality': {
      const patterns = detectPatterns(chart);
      const mainStar = mingStars.names[0];
      const nature = STAR_NATURE[mainStar];

      const mingBorrowedFrom = ming.borrowedFromName ? palaceLabel(ming.borrowedFromName) : '对宫';
      out.push(`**【命格定性】**`);
      if (!nature) {
        out.push(`命宫主星数据未提供${mingStars.borrowed ? `（空宫，借对宫${mingBorrowedFrom}论事）` : ''}，以下仅就可见信息论断。`);
      } else if (mingStars.borrowed) {
        out.push(`命宫无主星，借对宫${mingBorrowedFrom}的【${mingStars.names.join('、')}】论命。${nature.nature}借星安宫者，格局随对宫转动，人生更易受环境与外界牵引，宜主动择境。`);
      } else {
        out.push(`${mingStars.labels.join('、')}坐命于${BRANCHES[ming.branch]}宫。${nature.nature}${nature.element}。`);
      }

      if (nature) {
        out.push(`\n**【核心特质】**`);
        out.push(`${nature.traits.join('、')}。${nature.strength}`);
      }

      if (patterns.length > 0) {
        out.push(`\n**【成格】**`);
        out.push(patterns.map(pn => `**${pn}**：${PATTERN_TEXT[pn]}`).join('\n\n'));
      }

      out.push(`\n**【三方四正】**`);
      const triple = tripleAndSquare(chart, ming);
      out.push(triple.map(p => tripleLine(p)).join('\n'));
      out.push(`命宫为本、三方为用。三方四正的星曜决定这份天赋能在哪些领域落地。`);

      const sihua = chart.palaces.flatMap(p => palaceSihua(p).map(x => `${x.star.name}化${x.hua}入${palaceLabel(p.name)}`));
      if (sihua.length) {
        out.push(`\n**【生年四化】**`);
        out.push(sihua.map(s => `· ${s}`).join('\n'));
        out.push(`生年四化是本命固定的四条主线，决定一生重点经营的方向与课题。`);
      }

      out.push(`\n**【当前大限】**`);
      out.push(currentDaXian(chart));

      if (nature) {
        out.push(`\n**【优势与功课】**`);
        out.push(`优势：${nature.strength}\n\n功课：${nature.challenge}`);
      }

      out.push(classicsBlock(mingStars.names, [...new Set(chart.palaces.flatMap(p => palaceSihua(p).map(x => `化${x.hua}`)))], ['命宫']));
      break;
    }

    case 'love':
    case 'career':
    case 'wealth':
    case 'health':
      out.push(...palaceSection(chart, TOPIC_TO_PALACE[topic], topic));
      break;
  }

  return out;
}

/** 主题解读（对外主入口） */
export function interpret(chart: ZiweiChart, topic: TopicKey, opts: InterpretOptions = {}): string {
  const parts = topicSections(chart, topic);
  const q = opts.question?.trim();
  if (q) parts.push(questionBlock(chart, q));
  return finalize(parts);
}

function questionBlock(chart: ZiweiChart, q: string): string {
  return `\n**【就你的问题】**\n你问的是「${q}」。${currentDaXian(chart)}方向由星曜定，节奏由大限流年定，最终取舍仍在自己。`;
}

/** 供 API 判定是否可用（无 Key 时的兜底路径） */
export function isRuleEngineAvailable(): boolean {
  return Object.keys(STAR_NATURE).length === 14;
}

// ─── 四化飞星解读 ────────────────────────────────────────────────────────────

const VIEW_LABEL: Record<string, string> = { natal: '本命', daxian: '大限', liunian: '流年' };

export function interpretSiHua(
  chart: ZiweiChart,
  starName: string,
  hua: SiHua,
  view: 'natal' | 'daxian' | 'liunian' = 'natal',
): string {
  const out: string[] = [];
  const host = chart.palaces.find(p => p.stars.some(s => s.name === starName));
  const label = VIEW_LABEL[view];

  out.push(`**【${label}${starName}化${hua}基本含义】**`);
  const huaCore: Record<SiHua, string> = {
    禄: `化禄主财源、缘分与变现，是把天赋换成实际收益的那条线。${starName}化禄，主此星所代表的人事能顺畅生发、易得实惠。`,
    权: `化权主掌控、决断与担当，是把能力撑成局面的那条线。${starName}化权，主此星所代表的人事需由命主主动拿主意，越扛越有分量。`,
    科: `化科主名声、文书与贵人，是把实力让人看见的那条线。${starName}化科，主此星所代表的人事易得正名、考试文书与旁人提携。`,
    忌: `化忌主阻塞、亏欠与深刻功课，是命格里最钝的那一处。${starName}化忌，主此星所代表的人事需长期面对，过得去就是真本事。`,
  };
  out.push(huaCore[hua]);

  const nature = STAR_NATURE[starName];
  if (nature) out.push(`\n${starName}本性：${nature.nature}${nature.challenge}`);

  out.push(`\n**【落宫影响】**`);
  if (!host) {
    out.push(`${starName}在当前命盘中未定位到宫位，数据未提供，此处不作臆断。`);
  } else {
    const key = host.name;
    const text = SIHUA_IN_PALACE[hua][key];
    out.push(`${starName}化${hua}落在【${palaceLabel(key)}】，${PALACE_ROLE[palaceLabel(key)] ?? ''}。${text ?? '此宫所主领域会被这份能量直接牵动。'}`);
    out.push(`\n**【三方四正飞化路径】**`);
    out.push(tripleAndSquare(chart, host).map(tripleLine).join('\n'));
    out.push(`四化入本宫为「直入」，同时对宫与三合宫受其牵动——事在该处起，果在别处现。`);
  }

  out.push(`\n**【${label}时间维度影响】**`);
  if (view === 'natal') {
    out.push(`生年四化终身固定，${starName}化${hua}是一生重点经营的方向与课题，不因大限转移而消失。`);
  } else {
    out.push(`${label}四化是阶段性能量，只在${label}区间内生效，出限即减。当前：${currentDaXian(chart)}`);
  }

  const field = host ? PALACE_ROLE[palaceLabel(host.name)]?.split('、')[0] : undefined;
  out.push(`\n**【实际建议】**`);
  out.push(
    hua === '忌'
      ? `化忌处宜认账不宜硬碰：把${field ?? '该领域'}当作长期功课排进日程，定期复盘，避免用情绪做决定。`
      : `化${hua}处宜主动用：把${field ?? '该领域'}的资源、身份或名声落到实处，越早投入复利越明显。`,
  );

  out.push(classicsBlock([starName], [`化${hua}`], host ? [palaceLabel(host.name)] : []));
  return finalize(out);
}

// ─── 请求路由：把自然语言诉求映射到对应解读 ─────────────────────────────────

const PALACE_KEYS = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '交友', '官禄', '田宅', '福德', '父母'];

/** InsightPanel 六个主题模板的首句都以「请…」开头；不认出来就会被当成自由追问，把整段模板回显给用户 */
const TEMPLATE_HEAD_RE = /^请(生成|深度分析|深度解析|重点分析|解析|分析)/;

function normalizePalaceKey(raw: string): string | null {
  const t = raw.trim();
  const hit = PALACE_KEYS.find(k => k === t || `${k}宫` === t || t.replace('宫', '') === k.replace('宫', ''));
  return hit ?? null;
}

function topicByKeyword(q: string): TopicKey {
  // 主题按钮模板的正文会提到十二宫与四化（如命格总览里出现「财、官、迁」），
  // 全文匹配会串题——模板只认首句，自由追问才全文匹配。
  const probe = TEMPLATE_HEAD_RE.test(q) ? (q.split('\n')[0] ?? '') : q;

  if (/命格总览|总览/.test(probe)) return 'overview';
  if (/性格|个性|脾气|天赋特质/.test(probe)) return 'personality';
  if (/感情|婚姻|配偶|恋爱|另一半|夫妻/.test(probe)) return 'love';
  if (/事业|工作|职业|升职|创业|岗位|官禄/.test(probe)) return 'career';
  if (/财运|理财|收入|投资|薪|求财/.test(probe)) return 'wealth';
  if (/健康|身体|疾病|体检|睡眠|体质/.test(probe)) return 'health';
  if (/财|钱/.test(probe)) return 'wealth';
  return 'overview';
}

function finalize(parts: string[]): string {
  return join([...parts, TAIL]);
}

function join(parts: string[]): string {
  return parts.filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * 统一入口：给一句话，返回规则引擎能给出的最贴切解读。
 * 前端三种点击路径（主题按钮 / 宫位点击 / 四化点击）与自由追问都走这里。
 */
export function interpretRequest(chart: ZiweiChart, question: string): string {
  const q = question.trim();

  // 四化点击：【大限贪狼化禄】/【流年天机化忌】
  const sihua = q.match(/【(本命|大限|流年)?\s*([\u4e00-\u9fa5]{2})化([禄权科忌])】/);
  if (sihua) {
    const view = sihua[1] === '大限' ? 'daxian' : sihua[1] === '流年' ? 'liunian' : 'natal';
    return interpretSiHua(chart, sihua[2], sihua[3] as SiHua, view);
  }

  // 宫位点击：【田宅】/【官禄宫】
  const palaceHit = q.match(/分析【(.{2,4})】/);
  const palaceKey = palaceHit ? normalizePalaceKey(palaceHit[1]) : null;
  if (palaceKey) {
    const parts = palaceKey === '命宫'
      ? topicSections(chart, 'overview')
      : palaceSection(chart, palaceKey, 'generic');
    return finalize(parts);
  }

  // 主题按钮与自由追问
  const parts = topicSections(chart, topicByKeyword(q));
  if (!TEMPLATE_HEAD_RE.test(q)) parts.push(questionBlock(chart, q));
  return finalize(parts);
}
