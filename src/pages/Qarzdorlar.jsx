import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Tooltip,
  Form,
  InputNumber,
  Modal,
  Typography,
} from "antd";
import {
  useGetAllDebtsQuery,
  usePayDebtMutation,
  useBulkPayDebtsMutation,
} from "../context/debtApi";
import { toast } from "react-toastify";
import { EyeOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const Qarzdorlar = () => {
  const { Title } = Typography;
  const navigate = useNavigate();
  const [payDebt] = usePayDebtMutation();
  const [bulkPayDebts] = useBulkPayDebtsMutation();
  const [groupedDebts, setGroupedDebts] = useState([]);

  const [viewProducts, setViewProducts] = useState([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [warned, setWarned] = useState(false);

  const { data, isLoading, refetch } = useGetAllDebtsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,   // ✅ sahifaga kelgan zahoti qayta olib kelsin
    // pollingInterval: 15000,
  });
  
  useEffect(() => {
    if (data?.innerData && Array.isArray(data.innerData)) {
      const byClient = data.innerData.reduce((acc, d) => {
        const key = `${d.customerName}_${d.customerPhone}`;
        (acc[key] ??= []).push(d);
        return acc;
      }, {});
  
      const result = Object.values(byClient).map((debts) => {
        const first = debts[0];
  
        const totalDueAll = debts.reduce(
          (s, d) => s + Math.max(0, Number(d.debtAmount || 0)),
          0
        );
  
        const productsMerged = debts.flatMap((d) => {
          const sale = d.saleId;
          if (!sale || !Array.isArray(sale.products)) return [];
          const due = Math.max(0, Number(d.debtAmount || 0));
          const total = Number(sale.totalAmount || 0);
  
          const items = sale.products.map((p) => {
            const lineTotal = Number(p.price || 0) * Number(p.quantity || 1);
            const share =
              total > 0
                ? Math.round((due * lineTotal) / total)
                : Math.round(due / Math.max(sale.products.length, 1));
            return { ...p, debtId: d._id, productDue: share };
          });
  
          const sumShare = items.reduce((s, i) => s + i.productDue, 0);
          const diff = due - sumShare;
          if (items.length && diff !== 0) items[items.length - 1].productDue += diff;
  
          return items;
        });
  
        return {
          ...first,
          dueDebt: totalDueAll,
          productsMerged,
          debtIds: debts.filter(d => Number(d.debtAmount) > 0).map(d => d._id),
        };
      });
  
      // ✅ 0 qarzi qolmagan mijozlarni umuman ko‘rsatmaymiz
      setGroupedDebts(
        result.filter(r => Number(r.dueDebt) > 0 && (r.productsMerged?.length ?? 0) > 0)
      );
    }
  }, [data?.innerData]);
  
  
  
  
  

  // 🔁 grouping frontenddan emas — data.innerData to‘g‘ridan-to‘g‘ri kerakli formatda
  const handleView = (products = []) => {
    setViewProducts(products);
    setViewModalOpen(true);
  };

  const handlePay = (debt, product) => {
    // debt = { _id, debtAmount } ; product = { productDue, name, quantity, ... }
    const maxPayable = Math.min(Number(debt.debtAmount || 0), Number(product.productDue || 0));
  
    setSelectedDebt({ debt, product, maxPayable });
    // default sifatida to'liq ulush
    form.setFieldsValue({ amount: maxPayable });
    setIsPayModalOpen(true);
  };
  
  
  const handleFinishPay = async ({ amount }) => {
    const id = selectedDebt?.debt?._id;
    const payAmount = Number(amount);
    const maxPayable = Number(selectedDebt?.maxPayable || 0);
  
    if (!id) return toast.error("ID topilmadi");
    if (!payAmount || isNaN(payAmount) || payAmount <= 0) return toast.error("To‘lov miqdori noto‘g‘ri!");
    if (payAmount > maxPayable) return toast.warn("Kiritilgan summa ruxsat etilgandan ko‘p!");
  
    try {
      await payDebt({ id, amount: payAmount }).unwrap();
  
      // Modal ro‘yxati
      setViewProducts(prev =>
        prev
          .map(p =>
            p.productId === selectedDebt.product.productId && p.debtId === id
              ? { ...p, productDue: Math.max(0, Number(p.productDue) - payAmount) }
              : p
          )
          .filter(p => p.productDue > 0)
      );
  
      // Asosiy ro‘yxat — nol bo‘lsa mijozni o‘chiramiz
      setGroupedDebts(prev =>
        prev
          .map(group => {
            const touch = group.productsMerged?.some(p => p.debtId === id);
            if (!touch) return group;
            const newDue = Math.max(0, Number(group.dueDebt || 0) - payAmount);
            const newMerged = (group.productsMerged || [])
              .map(p =>
                p.debtId === id && p.productId === selectedDebt.product.productId
                  ? { ...p, productDue: Math.max(0, Number(p.productDue) - payAmount) }
                  : p
              )
              .filter(p => p.productDue > 0);
            return { ...group, dueDebt: newDue, productsMerged: newMerged };
          })
          .filter(g => Number(g.dueDebt) > 0 && (g.productsMerged?.length ?? 0) > 0)
      );
  
      toast.success("To‘lov bajarildi");
      setIsPayModalOpen(false);
  
      // server holatini ham sinxron tutish uchun fon yangilash:
      refetch(); // xohlasangiz buni qoldiring
    } catch (err) {
      toast.error(err?.data?.message || "To‘lov amalga oshmadi!");
    }
  };
  
  
  const handlePayAll = async (record) => {
    try {
      const ids = (record.debtIds && record.debtIds.length)
        ? record.debtIds
        : (data?.innerData || [])
            .filter(d => d.customerName === record.customerName &&
                         d.customerPhone === record.customerPhone &&
                         Number(d.debtAmount) > 0)
            .map(d => d._id);
  
      if (!ids.length) return toast.info("To‘lanadigan qarz topilmadi");
  
      await bulkPayDebts(ids).unwrap();
  
      // Optimistik: butun mijozni olib tashlaymiz
      setGroupedDebts(prev =>
        prev.filter(g =>
          !(g.customerName === record.customerName && g.customerPhone === record.customerPhone)
        )
      );
  
      toast.success("Barcha qarzlar to‘landi");
      refetch(); // server bilan sinxron
    } catch (e) {
      toast.error("Barcha qarzlarni to‘lashda xatolik");
    }
  };
  
  

  const columns = [
    { title: "Ism", dataIndex: "customerName", key: "customerName" },
    { title: "Telefon", dataIndex: "customerPhone", key: "customerPhone" },
    {
      title: "Umumiy qarz",
      dataIndex: "dueDebt",
      key: "dueDebt",
      render: (v) => `${Number(v || 0).toLocaleString()} $`,
    },
    {
      title: "Harakatlar",
      key: "act",
      render: (_, record) => (    // ✅ bu yerda record keldi
        <div style={{ display: "flex", gap: 8 }}>
          <Tooltip title="Mahsulotlarni ko‘rish">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleView(record.productsMerged)} // ✅ endi record ishlaydi
            />
          </Tooltip>
          <Tooltip title="Barcha qarzni to‘lash">
            <Button
              danger
              size="small"
              type="primary"
              onClick={() => handlePayAll(record)}
            >
              To‘lash
            </Button>
          </Tooltip>
        </div>
      ),
    }
    
  ];
  
  <Table
    columns={columns}
    dataSource={groupedDebts}
    loading={isLoading}
    rowKey={(r) => `${r.customerName}_${r.customerPhone}`}
    pagination={false}
  />
  
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Title level={3}>Qarzdorlar</Title>
        <Button
          type="text"
          icon={<CloseOutlined style={{ fontSize: 20 }} />}
          onClick={() => navigate("/")}
        />
      </div>

      <Table
  columns={columns}
  dataSource={groupedDebts}
  loading={isLoading}
  rowKey={(r) => `${r.customerName}_${r.customerPhone}`}
  pagination={false}
/>



<Modal
  open={viewModalOpen}
  onCancel={() => setViewModalOpen(false)}
  footer={null}
  title="Qarzdor mahsulotlar"
  width={550}
>
  <Table
    dataSource={viewProducts}
    rowKey={(r) => `${r.debtId}_${r.productId || r._id}`}
    pagination={false}
    columns={[
      { title: "Mahsulot", dataIndex: "name", key: "name" },
      { title: "Kub", dataIndex: "kub", key: "kub", render: v => `${v || 0} m³` },
   
      {
        title: "Qarz",
        dataIndex: "productDue",
        key: "productDue",
        render: (v) => `${Number(v || 0).toLocaleString()} $`,
      },  
      
      {
        title: "To‘lash",
        key: "pay",
        render: (_, product) => (
          <Button
            type="primary"
            danger
            size="small"
            onClick={() =>
              handlePay(
                { _id: product.debtId, debtAmount: product.productDue },
                product
              )
            }
          >
            To‘lash
          </Button>
        ),
      },
    ]}
  />
</Modal>



<Modal
  title="Qarz to‘lash"
  open={isPayModalOpen}
  onCancel={() => setIsPayModalOpen(false)}
  onOk={() => form.submit()}
  okText="To‘lash"
  cancelText="Bekor qilish"
>
  {selectedDebt && (
    <div style={{ marginBottom: 16, background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
      <p>
        <strong>Mahsulot:</strong> {selectedDebt.product?.name} (
        {selectedDebt.product?.quantity || 1} ta)
      </p>
      <p>
        <strong>Qarz miqdori:</strong>{" "}
        {Number(selectedDebt.debt?.debtAmount || 0).toLocaleString()} $
      </p>
    </div>
  )}

  <Form form={form} onFinish={handleFinishPay} layout="vertical">
  <Form.Item
  name="amount"
  label="To‘lov miqdori"
  rules={[{ required: true, message: "To‘lov miqdorini kiriting" }]}>
  <InputNumber
    style={{ width: "100%" }}
    min={0}
    max={selectedDebt?.maxPayable || 0}
    formatter={(v) =>
      v === undefined || v === null || v === "" ? "" : `${Number(v).toLocaleString()} $`
    }
    parser={(v) => String(v).replace(/[^\d.-]/g, "")}
    placeholder="Masalan: 100"
    onChange={(val) => {
      const max = Number(selectedDebt?.maxPayable || 0);
      const num = Number(val || 0);
      if (num > max) {
        form.setFieldsValue({ amount: max });
        if (!warned) {
          toast.warn("Kiritilgan summa ruxsat etilgandan ko‘p!");
          setWarned(true);
          setTimeout(() => setWarned(false), 800); // 0.8s dan keyin yana ogohlantira olsin
        }
      }
    }}
  />
</Form.Item>

  </Form>
</Modal>





    </div>
  );
};

export default Qarzdorlar;
