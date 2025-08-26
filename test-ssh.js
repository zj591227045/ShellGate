// 测试 SSH 连接的简单脚本
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testAPI() {
  try {
    console.log('🔧 测试 ShellGate API...\n');

    // 1. 测试登录
    console.log('1. 测试登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    if (loginResponse.data.success) {
      console.log('✅ 登录成功');
      const token = loginResponse.data.data.token;
      console.log(`📝 Token: ${token.substring(0, 20)}...`);

      // 设置认证头
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // 2. 测试获取连接列表
      console.log('\n2. 测试获取连接列表...');
      const connectionsResponse = await axios.get(`${API_BASE}/connections`);
      
      if (connectionsResponse.data.success) {
        console.log('✅ 获取连接列表成功');
        console.log(`📊 连接数量: ${connectionsResponse.data.data.length}`);
      }

      // 3. 测试创建 SSH 连接
      console.log('\n3. 测试创建 SSH 连接...');
      const createConnectionResponse = await axios.post(`${API_BASE}/connections`, {
        name: '测试 SSH 连接',
        host: 'localhost',
        port: 22,
        protocol: 'ssh',
        username: 'testuser',
        password: 'testpass',
        description: '用于测试的 SSH 连接'
      });

      if (createConnectionResponse.data.success) {
        console.log('✅ 创建连接成功');
        const connectionId = createConnectionResponse.data.data.id;
        console.log(`🔗 连接 ID: ${connectionId}`);

        // 4. 测试连接测试功能
        console.log('\n4. 测试连接测试功能...');
        try {
          const testResponse = await axios.post(`${API_BASE}/connections/${connectionId}/test`);
          
          if (testResponse.data.success) {
            console.log('✅ 连接测试成功');
            console.log(`⏱️  延迟: ${testResponse.data.data.latency}ms`);
          }
        } catch (error) {
          console.log('⚠️  连接测试失败（这是正常的，因为没有真实的 SSH 服务器）');
          console.log(`❌ 错误: ${error.response?.data?.error || error.message}`);
        }

        // 5. 测试获取活动会话
        console.log('\n5. 测试获取活动会话...');
        const sessionsResponse = await axios.get(`${API_BASE}/sessions`);
        
        if (sessionsResponse.data.success) {
          console.log('✅ 获取会话列表成功');
          console.log(`📊 活动会话数量: ${sessionsResponse.data.data.length}`);
        }

        // 6. 测试获取命令历史
        console.log('\n6. 测试获取命令历史...');
        const historyResponse = await axios.get(`${API_BASE}/commands/history`);
        
        if (historyResponse.data.success) {
          console.log('✅ 获取命令历史成功');
          console.log(`📊 历史记录数量: ${historyResponse.data.data.total}`);
        }

        // 7. 清理：删除测试连接
        console.log('\n7. 清理测试连接...');
        const deleteResponse = await axios.delete(`${API_BASE}/connections/${connectionId}`);
        
        if (deleteResponse.data.success) {
          console.log('✅ 删除连接成功');
        }
      }

    } else {
      console.log('❌ 登录失败');
    }

    console.log('\n🎉 API 测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testAPI();
