-- 数据权限相关 schema 变更（create_all 不会 ALTER 已有表时可手工执行）

-- 角色数据范围: 1本人 2本部门 3本部门及以下 4全部 5自定义
ALTER TABLE system_role ADD COLUMN IF NOT EXISTS data_scope INTEGER NOT NULL DEFAULT 1;

-- 用户所属部门
ALTER TABLE system_user ADD COLUMN IF NOT EXISTS dept_id INTEGER;

-- 角色自定义数据权限部门
CREATE TABLE IF NOT EXISTS system_role_dept (
    role_id INTEGER NOT NULL REFERENCES system_role(id),
    dept_id INTEGER NOT NULL REFERENCES system_dept(id),
    PRIMARY KEY (role_id, dept_id)
);

UPDATE system_role SET data_scope = 4 WHERE code = 'admin';
