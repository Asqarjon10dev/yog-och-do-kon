import React, { useMemo, useState } from "react";
import {
  Table, Button, Modal, Form, Input, InputNumber, Select,
  Space, Popconfirm, Typography, Tooltip
} from "antd";
import { EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import {
  useGetAllProductsQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "../context/productApi";

const { Title } = Typography;
const { Option } = Select;

export default function MahsulotTahrirlash() {
  const { data, isLoading, refetch } = useGetAllProductsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });
  const [updateProduct, { isLoading: saving }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: removing }] = useDeleteProductMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const products = useMemo(() => Array.isArray(data?.innerData) ? data.innerData : [], [data]);

  const onEdit = (rec) => {
    setEditing(rec);
    form.setFieldsValue({
      sellPricePerKub: rec.sellPricePerKub,
      currency: rec.currency || "$",
    });
    setOpen(true);
  };
  
  const onDelete = async (id) => {
    try {
      await deleteProduct(id).unwrap();
      toast.success("Mahsulot o‘chirildi");
      refetch();
    } catch (e) {
      toast.error(e?.data?.message || "O‘chirishda xatolik");
    }
  };

  const onFinish = async (values) => {
    try {
      const body = { ...values };
      // unitga qarab keraksiz fieldni olib tashlaymiz
      if (body.unit === "kub") delete body.quantity;
      else delete body.totalKub;

      await updateProduct({ id: editing._id, body }).unwrap();
      toast.success("Mahsulot yangilandi");
      setOpen(false);
      form.resetFields();
      setEditing(null);
      refetch();
    } catch (e) {
      toast.error(e?.data?.message || "Saqlashda xatolik");
    }
  };

  const columns = [
    { title: "Kodi", dataIndex: "code", key: "code", width: 110, ellipsis: true },
    { title: "Nomi", dataIndex: "name", key: "name", width: 220, ellipsis: true },
    { title: "Kategoriya", dataIndex: "category", key: "category", width: 150, ellipsis: true },
    { title: "Birlik", dataIndex: "unit", key: "unit", width: 80, align: "center" },
    {
      title: "Sotuv narxi",
      key: "sell",
      width: 140,
      render: (r) => `${Number(r.sellPricePerKub||0).toLocaleString()} ${r.currency||"$"}`,
      align: "right",
    },
    {
      title: "Miqdor",
      key: "qty",
      width: 120,
      render: (r) => r.unit === "kub" ? `${Number(r.totalKub||0)} m³` : `${Number(r.quantity||0)} dona`,
      align: "right",
    },
    {
      title: "Amal",
      key: "actions",
      width: 110,
      render: (_, rec) => (
        <Space size={6}>
          <Tooltip title="Narxni tahrirlash"><Button icon={<EditOutlined />} size="small" onClick={()=>onEdit(rec)} /></Tooltip>
          <Popconfirm title="O‘chirasizmi?" onConfirm={()=>onDelete(rec._id)}>
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
      fixed: "right",
    },
  ];
  

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Title level={3} style={{ marginBottom: 16}}>Mahsulotlarni tahrirlash</Title>
      </div>

      <Table
  className="table-tight"
  size="small"                // satrlarni kichikroq
  bordered
  tableLayout="fixed"         // ustunlar kengligi bo‘yicha “qadaladi”
  scroll={{ x: 980 }}         // kerak bo‘lsa gorizontal scroll
  columns={columns}
  dataSource={products}
  rowKey={(r) => r._id}
  pagination={{ pageSize: 10 }}
/>


<Modal
  title="Sotuv narxini tahrirlash"
  open={open}
  onCancel={()=>{ setOpen(false); setEditing(null); }}
  onOk={()=>form.submit()}
  okText="Saqlash"
>
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Form.Item name="sellPricePerKub" label="Sotuv narxi" rules={[{required:true, message:"Narxni kiriting"}]}>
      <InputNumber
        style={{width:"100%"}}
        min={0}
        formatter={(v)=> v === "" ? "" : `${Number(v).toLocaleString()} $`}
        parser={(v)=> String(v).replace(/[^\d.-]/g,"")}
      />
    </Form.Item>
    {/* Ixtiyoriy */}
    {/* <Form.Item name="currency" label="Valyuta" initialValue="$">
      <Select options={[{value:"$",label:"$"},{value:"so'm",label:"so'm"}]} />
    </Form.Item> */}
  </Form>
</Modal>

    </>
  );
}
