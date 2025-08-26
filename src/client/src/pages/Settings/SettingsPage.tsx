import React, { useState } from 'react';
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  Button, 
  Switch, 
  Select, 
  Divider,
  message,
  Modal,
  Space
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  SettingOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';

const { Content } = Layout;
const { Option } = Select;
const { confirm } = Modal;

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm();

  const handleChangePassword = async (values: any) => {
    try {
      setLoading(true);
      await authService.changePassword(values.currentPassword, values.newPassword);
      message.success('密码修改成功，请重新登录');
      passwordForm.resetFields();
      
      // 延迟登出，让用户看到成功消息
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAllDevices = () => {
    confirm({
      title: '确认登出所有设备？',
      icon: <ExclamationCircleOutlined />,
      content: '这将使您在所有设备上的登录状态失效，需要重新登录。',
      okText: '确认',
      cancelText: '取消',
      onOk() {
        logout();
        message.success('已登出所有设备');
      },
    });
  };

  return (
    <Content style={{ padding: 24 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 24 }}>设置</h2>

        {/* 用户信息 */}
        <Card 
          title={<><UserOutlined /> 用户信息</>}
          style={{ marginBottom: 24 }}
        >
          <Form layout="vertical">
            <Form.Item label="用户名">
              <Input value={user?.username} disabled />
            </Form.Item>
            <Form.Item label="邮箱">
              <Input value={user?.email} disabled />
            </Form.Item>
            <Form.Item label="用户ID">
              <Input value={user?.id} disabled />
            </Form.Item>
          </Form>
        </Card>

        {/* 密码修改 */}
        <Card 
          title={<><LockOutlined /> 密码设置</>}
          style={{ marginBottom: 24 }}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              label="当前密码"
              name="currentPassword"
              rules={[
                { required: true, message: '请输入当前密码' },
              ]}
            >
              <Input.Password placeholder="请输入当前密码" />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 8, message: '密码长度不能少于8位' },
              ]}
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 终端设置 */}
        <Card 
          title={<><SettingOutlined /> 终端设置</>}
          style={{ marginBottom: 24 }}
        >
          <Form layout="vertical">
            <Form.Item label="字体大小">
              <Select defaultValue="14" style={{ width: 120 }}>
                <Option value="12">12px</Option>
                <Option value="14">14px</Option>
                <Option value="16">16px</Option>
                <Option value="18">18px</Option>
              </Select>
            </Form.Item>
            <Form.Item label="字体族">
              <Select defaultValue="monaco" style={{ width: 200 }}>
                <Option value="monaco">Monaco</Option>
                <Option value="consolas">Consolas</Option>
                <Option value="ubuntu">Ubuntu Mono</Option>
              </Select>
            </Form.Item>
            <Form.Item label="主题">
              <Select defaultValue="dark" style={{ width: 120 }}>
                <Option value="dark">深色</Option>
                <Option value="light">浅色</Option>
              </Select>
            </Form.Item>
            <Form.Item label="光标闪烁">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="自动换行">
              <Switch defaultChecked />
            </Form.Item>
          </Form>
        </Card>

        {/* 安全设置 */}
        <Card title="安全设置">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <h4>会话管理</h4>
              <p style={{ color: '#666', marginBottom: 16 }}>
                管理您在所有设备上的登录状态
              </p>
              <Button 
                danger 
                onClick={handleLogoutAllDevices}
              >
                登出所有设备
              </Button>
            </div>
            
            <Divider />
            
            <div>
              <h4>自动登出</h4>
              <p style={{ color: '#666', marginBottom: 16 }}>
                设置无操作自动登出时间
              </p>
              <Select defaultValue="30" style={{ width: 200 }}>
                <Option value="15">15分钟</Option>
                <Option value="30">30分钟</Option>
                <Option value="60">1小时</Option>
                <Option value="120">2小时</Option>
                <Option value="0">永不</Option>
              </Select>
            </div>
          </Space>
        </Card>
      </div>
    </Content>
  );
};

export default SettingsPage;
