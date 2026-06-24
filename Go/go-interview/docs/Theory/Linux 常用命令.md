**Linux 常用命令**是面试中常见的考查点之一，主要考察候选人对 Linux 系统的基本操作和熟悉程度。以下是 Linux 常用命令的分类及其用途：

---

### 1. **文件和目录操作**
- **`ls`**：列出目录内容。
  ```bash
  ls -l      # 显示详细信息
  ls -a      # 显示隐藏文件
  ```
- **`cd`**：切换目录。
  ```bash
  cd /home   # 切换到 /home 目录
  cd ..      # 返回上一级目录
  ```
- **`pwd`**：显示当前工作目录。
  ```bash
  pwd
  ```
- **`mkdir`**：创建目录。
  ```bash
  mkdir new_folder
  ```
- **`rm`**：删除文件或目录。
  ```bash
  rm file.txt          # 删除文件
  rm -r folder_name    # 删除目录及其内容
  ```
- **`cp`**：复制文件或目录。
  ```bash
  cp source.txt dest.txt
  cp -r source_folder dest_folder
  ```
- **`mv`**：移动或重命名文件。
  ```bash
  mv old_name.txt new_name.txt
  mv file.txt /path/to/destination/
  ```

---

### 2. **文件内容查看**
- **`cat`**：查看文件内容。
  ```bash
  cat file.txt
  ```
- **`more`**：分页查看文件内容。
  ```bash
  more file.txt
  ```
- **`less`**：类似 `more`，支持上下滚动。
  ```bash
  less file.txt
  ```
- **`head`**：查看文件的前几行。
  ```bash
  head -n 10 file.txt   # 查看前 10 行
  ```
- **`tail`**：查看文件的后几行。
  ```bash
  tail -n 10 file.txt   # 查看后 10 行
  tail -f log.txt       # 实时查看日志文件
  ```

---

### 3. **权限管理**
- **`chmod`**：修改文件权限。
  ```bash
  chmod 755 file.txt    # 设置权限为 rwxr-xr-x
  chmod +x script.sh    # 添加可执行权限
  ```
- **`chown`**：修改文件所有者。
  ```bash
  chown user:group file.txt
  ```
- **`umask`**：设置默认权限掩码。
  ```bash
  umask 022
  ```

---

### 4. **进程管理**
- **`ps`**：查看当前进程。
  ```bash
  ps -ef      # 查看所有进程
  ps aux      # 查看详细进程信息
  ```
- **`top`**：实时显示系统资源使用情况。
  ```bash
  top
  ```
- **`kill`**：终止进程。
  ```bash
  kill -9 PID   # 强制终止指定进程
  ```
- **`jobs`**：查看后台任务。
  ```bash
  jobs
  ```
- **`bg`**：将任务放到后台运行。
  ```bash
  bg %1
  ```
- **`fg`**：将后台任务切换到前台。
  ```bash
  fg %1
  ```

---

### 5. **网络相关**
- **`ping`**：测试网络连通性。
  ```bash
  ping www.google.com
  ```
- **`ifconfig`**：查看或配置网络接口（较旧）。
  ```bash
  ifconfig
  ```
- **`ip`**：查看或配置网络接口（推荐）。
  ```bash
  ip addr
  ```
- **`netstat`**：查看网络连接。
  ```bash
  netstat -an
  ```
- **`curl`**：发送 HTTP 请求。
  ```bash
  curl http://example.com
  ```
- **`wget`**：下载文件。
  ```bash
  wget http://example.com/file.zip
  ```

---

### 6. **磁盘管理**
- **`df`**：查看磁盘使用情况。
  ```bash
  df -h
  ```
- **`du`**：查看目录或文件的大小。
  ```bash
  du -sh folder_name
  ```
- **`mount`**：挂载文件系统。
  ```bash
  mount /dev/sda1 /mnt
  ```
- **`umount`**：卸载文件系统。
  ```bash
  umount /mnt
  ```

---

### 7. **系统管理**
- **`uname`**：查看系统信息。
  ```bash
  uname -a
  ```
- **`whoami`**：查看当前用户。
  ```bash
  whoami
  ```
- **`uptime`**：查看系统运行时间。
  ```bash
  uptime
  ```
- **`shutdown`**：关机或重启。
  ```bash
  shutdown -h now    # 立即关机
  shutdown -r now    # 立即重启
  ```

---

### 8. **日志查看**
- **`dmesg`**：查看系统启动日志。
  ```bash
  dmesg
  ```
- **`journalctl`**：查看系统日志（适用于 systemd）。
  ```bash
  journalctl -xe
  ```

---

### 面试中的常见问题
1. **你最常用的 Linux 命令有哪些？**
   - 可以提到文件操作（`ls`、`cd`）、进程管理（`ps`、`top`）、网络调试（`ping`、`curl`）等。

2. **如何查看某个文件的实时更新内容？**
   - 使用 `tail -f` 命令。

3. **如何杀死一个进程？**
   - 使用 `ps` 找到进程 ID，然后用 `kill -9 PID` 终止。

通过熟练掌握这些常用命令，可以高效地完成 Linux 系统的日常操作和问题排查。