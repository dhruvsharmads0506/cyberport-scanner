import express from "express";
import { createServer as createViteServer } from "vite";
import net from "net";
import dns from "dns";
import { promisify } from "util";

const lookup = promisify(dns.lookup);

async function startServer() {

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  function detectService(port:number){

    const services:any = {
      21:"FTP",
      22:"SSH",
      23:"Telnet",
      25:"SMTP",
      53:"DNS",
      80:"HTTP",
      110:"POP3",
      143:"IMAP",
      443:"HTTPS",
      3306:"MySQL",
      3389:"RDP",
      5432:"PostgreSQL",
      6379:"Redis",
      8080:"HTTP Proxy"
    };

    return services[port] || "Unknown";
  }

  function detectOS(banner:string){

    banner = banner.toLowerCase();

    if(banner.includes("ubuntu")) return "Linux (Ubuntu)";
    if(banner.includes("debian")) return "Linux (Debian)";
    if(banner.includes("centos")) return "Linux (CentOS)";
    if(banner.includes("windows")) return "Windows";
    if(banner.includes("microsoft")) return "Windows Server";
    if(banner.includes("freebsd")) return "FreeBSD";
    if(banner.includes("openssh")) return "Linux/Unix";

    return "Unknown";
  }

  function detectVersion(banner:string){

    const match = banner.match(/[0-9]+\.[0-9]+(\.[0-9]+)?/);

    if(match){
      return match[0];
    }

    return null;
  }

  function securityHint(port:number){

    if(port===21) return "FTP may allow anonymous login";
    if(port===23) return "Telnet is insecure (plaintext)";
    if(port===3306) return "MySQL exposed to internet";
    if(port===3389) return "RDP brute force risk";

    return null;
  }

  app.post("/api/scan", async (req,res)=>{

    const {target,startPort,endPort} = req.body;

    if(!target || isNaN(startPort) || isNaN(endPort)){
      return res.status(400).json({error:"Invalid parameters"});
    }

    try{

      let ip = target;

      if(target.includes("://")){
        const url = new URL(target);
        ip = url.hostname;
      }
      else if(!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(target)){
        const result = await lookup(target);
        ip = result.address;
      }

      const scanPromises=[];

      for(let port=startPort;port<=endPort;port++){
        scanPromises.push(scanPort(ip,port));
      }

      const scanResults = await Promise.all(scanPromises);

      res.json({
        target:ip,
        results:scanResults.filter(r=>r!==null)
      });

    }
    catch(error:any){
      res.status(500).json({error:error.message});
    }

  });


  function scanPort(ip:string,port:number):Promise<any>{

    return new Promise((resolve)=>{

      const socket = new net.Socket();
      let resolved=false;
      let banner="";
      let isOpen=false;

      socket.setTimeout(2000);

      socket.connect(port,ip,()=>{

        isOpen=true;

        if(port===80 || port===8080){
          socket.write(`HEAD / HTTP/1.1\r\nHost: ${ip}\r\n\r\n`);
        }

        if(port===22){
          socket.write("\n");
        }

      });

      socket.on("data",(data)=>{

        banner += data.toString();

        if(!resolved){

          resolved=true;

          const result:any = {
            port,
            status:"open",
            service: detectService(port)
          };

          const cleanBanner = banner.trim().substring(0,200);

          if(cleanBanner){

            result.banner = cleanBanner;

            const version = detectVersion(cleanBanner);
            if(version) result.version = version;

            const os = detectOS(cleanBanner);
            if(os !== "Unknown") result.os = os;

          }

          const sec = securityHint(port);
          if(sec) result.security = sec;

          resolve(result);

          socket.destroy();
        }

      });

      socket.on("timeout",()=>{

        socket.destroy();

        if(!resolved && isOpen){

          resolved=true;

          const result:any = {
            port,
            status:"open",
            service: detectService(port)
          };

          const sec = securityHint(port);
          if(sec) result.security = sec;

          resolve(result);
        }

        if(!resolved){
          resolved=true;
          resolve(null);
        }

      });

      socket.on("error",()=>{

        socket.destroy();

        if(!resolved){
          resolved=true;
          resolve(null);
        }

      });

    });

  }


  if(process.env.NODE_ENV!=="production"){

    const vite = await createViteServer({
      server:{middlewareMode:true},
      appType:"spa"
    });

    app.use(vite.middlewares);

  }
  else{

    app.use(express.static("dist"));

  }

  app.listen(PORT,"0.0.0.0",()=>{
    console.log(`Server running on http://localhost:${PORT}`);
  });

}

startServer();