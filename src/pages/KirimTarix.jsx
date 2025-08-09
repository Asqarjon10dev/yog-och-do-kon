import React, { useMemo, useState } from "react";
import { DatePicker, Typography, Row, Col, Table } from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const KirimTarix = ({ allProducts }) => {
  // Sana oralig‘i (yoki bitta kunni ham tanlashingiz mumkin)
  const [dateRange, setDateRange] = useState(null);

  // Ma'lumotni barqarorlashtirish
  const items = useMemo(() => {
    if (Array.isArray(allProducts)) return allProducts;
    return allProducts?.innerData || [];
  }, [allProducts]);

  // Sana bo‘yicha filtrlash (inklyuziv)
  const filtered = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return items;
    const start = dayjs(dateRange[0]).startOf("day");
    const end = dayjs(dateRange[1]).endOf("day");
    return items.filter(it =>
      dayjs(it.createdAt).isBetween(start, end, null, "[]")
    );
  }, [items, dateRange]);

  // Kub hisoblash (turli yozuvlar uchun moslashuvchan)
  const getKub = (it) => {
    if (it?.kub != null) return Number(it.kub) || 0;
    if (it?.totalKub != null) return Number(it.totalKub) || 0;
    const l = Number(it.length || 0), w = Number(it.width || 0), h = Number(it.height || 0);
    if (l && w && h) return l * w * h;
    if (it?.quantity != null) return Number(it.quantity) || 0;
    return 0;
    };

  const getPricePerKub = (it) => Number(it.pricePerKub || 0);
  const getSellPerKub  = (it) => Number(it.sellPricePerKub || 0);
  const getCurrency    = (it) => it.currency || "$";

  // Faqat $ bo‘yicha umumiylar (filtrlangan ro‘yxatdan)
  const totalsUSD = useMemo(() => {
    let total = 0, profit = 0;
    for (const it of filtered) {
      if (getCurrency(it) !== "$") continue;
      const kub = getKub(it);
      const buy = getPricePerKub(it);
      const sell = getSellPerKub(it);
      total  += buy * kub;
      profit += (sell - buy) * kub;
    }
    return { total, profit };
  }, [filtered]);

  return (
    <>
      <RangePicker
        value={dateRange}
        onChange={setDateRange}
        allowClear
        style={{ width: 280 }}
        presets={[
          { label: "Bugun", value: [dayjs().startOf("day"), dayjs().endOf("day")] },
          { label: "Kecha", value: [dayjs().subtract(1,"day").startOf("day"), dayjs().subtract(1,"day").endOf("day")] },
          { label: "Oxirgi 7 kun", value: [dayjs().subtract(6,"day").startOf("day"), dayjs().endOf("day")] },
          { label: "Bu oy", value: [dayjs().startOf("month"), dayjs().endOf("month")] },
        ]}
      />

      <Row gutter={24} style={{ marginTop: 16, marginBottom: 8 }}>
        <Col>
          <Text>Umumiy summa</Text>
          <Title level={5} style={{ margin: 0 }}>
            {totalsUSD.total.toLocaleString()} $
          </Title>
        </Col>
        <Col>
          <Text>Umumiy foyda</Text>
          <Title level={5} style={{ margin: 0 }}>
            {totalsUSD.profit.toLocaleString()} $
          </Title>
        </Col>
      </Row>

      <Table
        style={{ marginTop: 8 }}
        size="small"
        bordered
        dataSource={filtered}
        rowKey={(r) => r._id || r.code}
        pagination={false}
        columns={[
          { title: "Mahsulot", dataIndex: "name" },
          { title: "Kod", dataIndex: "code" },
          { title: "Kategoriya", dataIndex: "category" },
          {
            title: "Kub hajmi",
            render: (it) => {
              const kub = getKub(it);
              return kub ? `${kub.toLocaleString()} m³` : "-";
            },
          },
          {
            title: "Narxi (1m³)",
            render: (it) => {
              const p = getPricePerKub(it);
              return p ? `${p.toLocaleString()} ${getCurrency(it)}` : "-";
            },
          },
          {
            title: "Sotish narxi (1m³)",
            render: (it) => {
              const s = getSellPerKub(it);
              return s ? `${s.toLocaleString()} ${getCurrency(it)}` : "-";
            },
          },
          {
            title: "Umumiy kirim",
            render: (it) => {
              const kub = getKub(it), p = getPricePerKub(it);
              return kub && p ? `${(kub * p).toLocaleString()} ${getCurrency(it)}` : "-";
            },
          },
          {
            title: "Foyda",
            render: (it) => {
              const kub = getKub(it), p = getPricePerKub(it), s = getSellPerKub(it);
              return kub && p && s ? `${((s - p) * kub).toLocaleString()} ${getCurrency(it)}` : "-";
            },
          },
        ]}
      />
    </>
  );
};

export default KirimTarix;
