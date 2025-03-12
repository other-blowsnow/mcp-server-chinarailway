import moment from 'moment';

class ChinaRailway {
    static ticketCache = [];
    static stationName;
    static stationCode;

    static async getStationName(code) {
        if (!this.stationName) {
            await this.getStationData();
        }
        return this.stationName[code];
    }

    static async getStationCode(name) {
        if (!this.stationCode) {
            await this.getStationData();
        }
        return this.stationCode[name];
    }

    static clearTicketCache() {
        this.ticketCache = [];
    }

    static async getStationData() {
        let response = await fetch('https://kyfw.12306.cn/otn/resources/js/framework/station_name.js');
        let stationList = (await response.text())
            .match(/(?<=').+(?=')/)[0]
            .split('@')
            .slice(1);

        this.stationCode = {};
        this.stationName = {};
        stationList.forEach((station) => {
            let details = station.split('|');
            this.stationCode[details[1]] = details[2];
            this.stationName[details[2]] = details[1];
        });
    }

    static async findCities(cityName) {
        if (!this.stationCode) {
            await this.getStationData();
        }
        let matchCities = [];
        for (const stationNameKey in this.stationCode) {
            // 优先完全匹配的名称
            if (stationNameKey === cityName) {
                return [this.stationCode[stationNameKey]];
            } else if (stationNameKey.includes(cityName)) {
                matchCities.push(this.stationCode[stationNameKey])
            }
        }
        return matchCities;
    }

    static async searchTickets(date, fromCity, toCity) {
        if (moment().isSameOrAfter(moment(date, 'YYYYMMDD').add(1, 'days')) || moment().add(15, 'days').isBefore(moment(date, 'YYYYMMDD'))) {
            throw new Error('日期需为0~15天内');
        }

        // 出发城市
        const fromCities = await this.findCities(fromCity)
        if (fromCities.length === 0) {
            throw new Error(`没有找到出发城市: ${fromCity}`)
        }
        // 到达城市
        const toCities = await this.findCities(toCity)
        if (toCities.length === 0) {
            throw new Error(`没有找到到达城市: ${toCity}`)
        }
        const fromCityCode = fromCities[0]
        const toCityCode = toCities[0]

        // 获取cookie
        const res2 = await fetch('https://kyfw.12306.cn/');
        const cookie = res2.headers.get('set-cookie');
        let cookieStr = '';
        cookie.split(',').forEach((item) => {
            const [key, value] = item.split(';')[0].split('=');
            cookieStr += `${key}=${value}; `;
        })
        let api =
            'https://kyfw.12306.cn/otn/leftTicket/queryG?leftTicketDTO.train_date=' +
            moment(date, 'YYYYMMDD').format('YYYY-MM-DD') +
            '&leftTicketDTO.from_station=' +
            fromCityCode +
            '&leftTicketDTO.to_station=' +
            toCityCode +
            '&purpose_codes=ADULT';

        let res = await fetch(api, {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                Cookie: cookieStr,
            },
        });
        let data = await res.json();
        if (!data || !data.status) {
            throw new Error('获取余票数据失败');
        }

        data = this.parseTrainInfo(data.data.result, data.data.map);

        return data;
    }

    static _parsePriceNumber(da) {
        if (da == "0") {
            return ""
        }
        var c9 = da.toString().indexOf(".") == -1 ? da + ".0" : da;
        return c9
    }

    static _parsePrice(df) {
        var dh = "";
        var c9 = {};
        var dd = df.length / 7;
        for (var dc = 0; dc < dd; dc++) {
            var dg = df.substring(dc * 7, dc * 7 + 7);
            var db = dg.substring(0, 1);
            var de = dg.substring(1, 2);
            var da = this._parsePriceNumber(Number(dg.substring(2)) / 10);
            dh += db;
            c9[db + de] = da
        }
        c9.all = dh;
        return c9
    }

    static _parsePrice2(de) {
        var df = {};
        var dd = de.length / 10;
        for (var da = 0; da < dd; da++) {
            var dc = de.substring(da * 10, da * 10 + 10);
            var c9 = dc.substring(0, 1);
            var db = dc.substring(6, 7);
            var dg = this._parsePriceNumber(Number(dc.substring(1, 6)) / 10);
            if ("3" == db) {
                df.W = dg
            } else {
                df[c9] = dg
            }
        }
        return df
    }

    static parseTrainInfo(strs, map) {
        const list = [];
        for (const str of strs) {
            // Ref: https://kyfw.12306.cn/otn/resources/merged/queryLeftTicket_end_js.js

            let arr = str.split('|');
            let data = {
                secretStr: arr[0],
                buttonTextInfo: arr[1],
                train_no: arr[2],
                station_train_code: arr[3],
                start_station_telecode: arr[4],
                end_station_telecode: arr[5],
                from_station_telecode: arr[6],
                to_station_telecode: arr[7],
                start_time: arr[8],
                arrive_time: arr[9],
                lishi: arr[10],
                canWebBuy: arr[11],
                yp_info: arr[12],
                start_train_date: arr[13],
                train_seat_feature: arr[14],
                location_code: arr[15],
                from_station_no: arr[16],
                to_station_no: arr[17],
                is_support_card: arr[18],
                controlled_train_flag: arr[19],
                gg_num: arr[20],
                gr_num: arr[21],
                qt_num: arr[22],
                rw_num: arr[23],
                rz_num: arr[24],
                tz_num: arr[25],
                wz_num: arr[26],
                yb_num: arr[27],
                yw_num: arr[28],
                yz_num: arr[29],
                ze_num: arr[30],
                zy_num: arr[31],
                swz_num: arr[32],
                srrb_num: arr[33],
                yp_ex: arr[34],
                seat_types: arr[35],
                exchange_train_flag: arr[36],
                houbu_train_flag: arr[37],
                houbu_seat_limit: arr[38],
                yp_info_new: arr[39],
                dw_flag: arr[46],
                stopcheckTime: arr[48],
                country_flag: arr[49],
                local_arrive_time: arr[50],
                local_start_time: arr[51],
                bed_level_info: arr[53],
                seat_discount_info: arr[54],
                sale_time: arr[55],
                from_station_name: map[arr[6]],
                to_station_name: map[arr[7]],
            };

            const ticketPrices = this._parsePrice2(data.yp_info_new);
            // 9 / P 商务座 / 特等座 价格
            // D 优选 一等座
            // M 一等座
            // O / S  二等座
            // 6 / A  高级软卧
            // 4 / I / F 软卧/动卧/一等卧
            // 3 / J 硬卧 二等卧
            // 2 软座
            // 1 硬座
            // W 无座
            // 5 / D / E / G / H / Q
            data.tickets = {
                商务座: {
                    num: data.swz_num || '-',
                    price: ticketPrices['9'] || ticketPrices['P'] || '-',
                },
                特等座: {
                    num: data.tz_num || '-',
                    price: ticketPrices['9'] || ticketPrices['P'] || '-',
                },
                优选一等座: {
                    num: data.gg_num || '-',
                    price: ticketPrices['D']  || '-',
                },
                一等座: {
                    num: data.zy_num || '-',
                    price: ticketPrices['M']  || '-',
                },
                二等座: {
                    num: data.ze_num || '-',
                    price: ticketPrices['O'] || ticketPrices['S'] || '-',
                },
                高级软卧: {
                    num: data.gr_num || '-',
                    price: ticketPrices['6'] || '-',
                },
                软卧: {
                    num: data.rw_num || '-',
                    price: ticketPrices['4'] || ticketPrices['I'] || ticketPrices['F'] || '-',
                },
                硬卧: {
                    num: data.yw_num || '-',
                    price: ticketPrices['3'] || ticketPrices['J'] || '-',
                },
                软座: {
                    num: data.rz_num || '-',
                    price: ticketPrices['2'] || '-',
                },
                硬座: {
                    num: data.yz_num || '-',
                    price: ticketPrices['1'] || '-',
                },
                无座: {
                    num: data.wz_num || '-',
                    price: ticketPrices['W'] || '-',
                },
                其他: {
                    num: data.qt_num || '-',
                    price: ticketPrices['D'] || ticketPrices['E'] || ticketPrices['G'] || ticketPrices['H'] || ticketPrices['Q'] || '-',
                },
            };

            list.push(data);
        }
        return list;
    }
}

export default ChinaRailway;