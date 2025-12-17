import { NewsItem } from './types';

export const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: '网传“人社保卡必须在规定时间内换发”系谣言',
    source: '中国互联网联合辟谣平台',
    status: 'debunked',
    timestamp: '10分钟前',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=800&auto=format&fit=crop',
    url: 'https://www.piyao.org.cn/pysjk/frontsql.htm?kw=%E7%BD%91%E4%BC%A0%E2%80%9C%E4%BA%BA%E7%A4%BE%E4%BF%9D%E5%8D%A1%E5%BF%85%E9%A1%BB%E5%9C%A8%E8%A7%84%E5%AE%9A%E6%97%B6%E9%97%B4%E5%86%85%E6%8D%A2%E5%8F%91%E2%80%9D%E7%B3%BB%E8%B0%A3%E8%A8%80'
  },
  {
    id: '2',
    title: '官方通报：多地暴雨预警升级，应急响应启动',
    source: '今日头条',
    status: 'verified',
    timestamp: '30分钟前',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop',
    url: 'https://so.toutiao.com/search?dvpf=pc&keyword=暴雨预警应急响应'
  },
  {
    id: '3',
    title: '微博热搜：我国成功发射一颗新卫星',
    source: '微博',
    status: 'verified',
    timestamp: '1小时前',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
    url: 'https://s.weibo.com/weibo?q=%23我国成功发射%23'
  },
  {
    id: '4',
    title: '谣言：长期喝纯净水会导致钙流失',
    source: '中国互联网联合辟谣平台',
    status: 'debunked',
    timestamp: '2小时前',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&auto=format&fit=crop',
    url: 'https://www.piyao.org.cn/pysjk/frontsql.htm?kw=%E8%B0%A3%E8%A8%80%EF%BC%9A%E9%95%BF%E6%9C%9F%E5%96%9D%E7%BA%AF%E5%87%80%E6%B0%B4%E4%BC%9A%E5%AF%BC%E8%87%B4%E9%92%99%E6%B5%81%E5%A4%B1'
  },
  {
    id: '5',
    title: '热点：新能源汽车下乡政策最新解读',
    source: '今日头条',
    status: 'verified',
    timestamp: '3小时前',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop',
    url: 'https://so.toutiao.com/search?keyword=新能源汽车下乡'
  }
];

export const INITIAL_GRAPH_DATA = {
  nodes: [],
  links: []
};