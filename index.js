var expect = require("truffle-expect");
var DeferredChain = require("./src/deferredchain");
var deploy = require("./src/actions/deploy");
var deployMany = require("./src/actions/deploymany");
var link = require("./src/actions/link");
var create = require("./src/actions/new");

class Deployer {
  constructor(options){
    options = options || {};
    expect.options(options, [
      "provider",
      "network",
      "network_id"
    ]);

    this.chain = new DeferredChain();
    this.logger = options.logger || {log: function() {}};
    this.known_contracts = {};

    (options.contracts || [])
      .forEach(contract => this.known_contracts[contract.contract_name] = contract);

    this.network = options.network;
    this.network_id = options.network_id;
    this.provider = options.provider;
    this.basePath = options.basePath || process.cwd();
  }

  // Note: In all code below we overwrite this.chain every time .then() is used
  // in order to ensure proper error processing.
  start() {
    return this.chain.start()
  }

  link(library, destinations){
    return this.queueOrExec(link(library, destinations, this))
  }


  deploy() {
    const args = Array.prototype.slice.call(arguments);
    const contract = args.shift();

    return (Array.isArray(contract))
      ? this.queueOrExec(deployMany(contract, this))
      : this.queueOrExec(deploy(contract, args, this));
  }

  new() {
    const args = Array.prototype.slice.call(arguments);
    const contract = args.shift();

    return this.queueOrExec(create(contract, args, this));
  }

  then(fn) {
    var self = this;

    return this.queueOrExec(function() {
      self.logger.log("Running step...");
      return fn(this);
    });
  }

  queueOrExec(fn){
    var self = this;

    if (this.chain.started == true) {
      return new Promise(function(accept, reject) {
        accept();
      }).then(fn);
    } else {
      return this.chain.then(fn);
    }
  }
}

module.exports = Deployer;
