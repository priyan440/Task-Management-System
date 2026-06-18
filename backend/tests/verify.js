const assert = require('assert');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');

async function runTests() {
  console.log('🧪 Starting Backend Integration Sanity Checks...');

  try {
    // 1. Validate Password Encryptions
    const password = 'indigo_password_123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    assert.strictEqual(await bcrypt.compare(password, hash), true);
    console.log('✅ Passwords bcrypt utility works.');

    // 2. Validate Mock User Database operations
    const email = 'test_user_' + Date.now() + '@aurora.com';
    const user = await User.create({
      name: 'Tester User',
      email: email,
      password: hash,
      role: 'Admin',
      isVerified: true
    });
    assert.ok(user._id);
    assert.strictEqual(user.name, 'Tester User');
    console.log('✅ User Creation & JSON Fallback engine works.');

    // 3. Query created user
    const queriedUser = await User.findOne({ email });
    assert.strictEqual(queriedUser.name, 'Tester User');
    console.log('✅ User Query matches successfully.');

    // 4. Create Workspace and link User
    const workspace = await Workspace.create({
      name: 'Testing Workspace',
      owner: user._id,
      members: [{ user: user._id, role: 'Admin' }]
    });
    assert.ok(workspace._id);
    console.log('✅ Workspace created and linked.');

    // 5. Create Task
    const task = await Task.create({
      title: 'Complete Antigravity Task Management Implementation',
      description: 'Implement frontend UI and wire up integrations',
      status: 'Todo',
      priority: 'High',
      category: 'Work',
      workspace: workspace._id,
      creator: user._id
    });
    assert.ok(task._id);
    console.log('✅ Task creation successfully checked.');

    // Clean up
    await User.findByIdAndDelete(user._id);
    await Workspace.findByIdAndDelete(workspace._id);
    await Task.findByIdAndDelete(task._id);
    console.log('🧹 Cleaned up testing records.');

    console.log('\n🎉 ALL SANITY INTEGRATION CHECKS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ SANITY TESTS FAILED:', error);
    process.exit(1);
  }
}

// Wait brief period for db.js initialization
setTimeout(runTests, 500);
