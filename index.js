const PEDDING = Symbol("pedding");
const FULFILLED = Symbol("fulfilled");
const REJECTED = Symbol("rejected");

function isFunction(functionToCheck) {
  return (
    functionToCheck && {}.toString.call(functionToCheck) === "[object Function]"
  );
}

 class MyPromise {
  static resolve(value) {
    if(value instanceof MyPromise) return value;
    return new MyPromise(r=>r(value))
  }
  static reject(error) {
    return new MyPromise((_, r)=>r(error))
  }

  constructor(fn) {
    this.state = PEDDING;

    this.value = undefined;

    this.queue = {
      [FULFILLED]: [],
      [REJECTED]: []
    };
    try {
      fn(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
  }

  _runQueue(data, type) {
    this.state = type;
    this.value = data;
    let cb;
    while ((cb = this.queue[type].shift())) {
      cb(data);
    }
  }

  _resolve(data) {
    if (this.state !== PEDDING) return;

    const run = () => {
      if (data instanceof MyPromise) {
        data.then(
          res => {
            this._runQueue(res, FULFILLED);
          },
          err => {
            this._runQueue(err, REJECTED);
          }
        );
      } else {
        this._runQueue(data, FULFILLED);
      }
    };

    setTimeout(run, 0);
  }

  _reject(err) {
    if (this.state !== PEDDING) return;
    const run = () => {
      this._runQueue(err, REJECTED);
    };

    setTimeout(run, 0);
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const newResolve = value => {
        if (!isFunction(onFulfilled)) {
          resolve(value);
        } else {
          let res;
          try {
            res = onFulfilled(value);
          } catch (error) {
            reject(error);
          }
          if (res instanceof MyPromise) {
            MyPromise.then(resolve, reject);
          } else {
            resolve(res);
          }
        }
      };

      const newReject = value => {
        if (!isFunction(onRejected)) {
          reject(value);
        } else {
          let res;
          try {
            res = onRejected(value);
          } catch (error) {
            reject(error);
          }
          if (res instanceof MyPromise) {
            MyPromise.then(resolve, reject);
          } else {
            resolve(res);
          }
        }
      };

      switch (this.state) {
        case PEDDING:
          this.queue[FULFILLED].push(newResolve);
          this.queue[REJECTED].push(newReject);
          break;
        case FULFILLED:
          newResolve(this.value);
          break;
        case REJECTED:
          newReject(this.value);
          break;
      }
    });
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
}

module.exports = {
  deferred: ()=>{
    let dfd = {}

    dfd.promise = new MyPromise((...args)=>{
      dfd.resolve = args[0];
      dfd.reject = args[1];
    })

    return dfd;
  }
}
