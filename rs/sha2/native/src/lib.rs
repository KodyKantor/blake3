use neon::prelude::*;
use neon::register_module;
use sha2::Digest;
use std::convert::TryInto;

pub fn hash(mut cx: FunctionContext) -> JsResult<JsValue> {
    let input_buffer = cx.argument::<JsBuffer>(0)?;
    let _length = cx.argument::<JsNumber>(1)?;
    let input_bytes = cx.borrow(&input_buffer, |data| data.as_slice::<u8>());

    let mut hasher = sha2::Sha256::new();
    hasher.update(input_bytes);
    let dgst = hasher.finalize();

    let mut output_buffer = cx.buffer(sha2::Sha256::output_size().try_into().unwrap())?;
    cx.borrow_mut(&mut output_buffer, |data| {
        data.as_mut_slice().copy_from_slice(&dgst);
    });

    Ok(output_buffer.upcast())
}

pub struct Sha2Hash {
    hasher: sha2::Sha256,
}

declare_types! {
    pub class JsHash for Sha2Hash {
        // Constructing is awkward in neon, so this is how this works:
        // 0 args = new regular hash
        // (not supp) 1 args = use the first arg (a Buffer) as the key
        // (not supp) 2 args = use the second arg (a String) to derive a key
        init(cx) {
            let hasher = match cx.len() {
                0 => sha2::Sha256::new(),
                _ => panic!("unexpected number of arguments"),
            };

            Ok(Sha2Hash {
                hasher: hasher,
            })
        }

        method update(mut cx) {
            let input_buffer = cx.argument::<JsBuffer>(0)?;
            let mut this = cx.this();

            {
                let guard = cx.lock();
                let mut instance = this.borrow_mut(&guard);
                let input_bytes = input_buffer.borrow(&guard);
                instance.hasher.update(input_bytes.as_slice::<u8>());
            }

            Ok(cx.undefined().upcast())
        }

        method digest(mut cx) {
            let target_bytes_ref = cx.argument::<JsBuffer>(0)?;
            let this = cx.this();

            {
                let guard = cx.lock();
                let instance = this.borrow(&guard);
                let target_bytes = target_bytes_ref.borrow(&guard);
                let dgst = instance.hasher.clone().finalize();

                target_bytes.as_mut_slice::<u8>().copy_from_slice(&dgst);
            }


            Ok(cx.undefined().upcast())
        }

        method free(mut cx) {
            // For compat with wasm code
            Ok(cx.undefined().upcast())
        }

        method reader(mut cx) {
            let this = cx.this();
            Ok(JsReader::new(&mut cx, vec![this])?.upcast())
        }
    }
}

pub struct HashReader {}

declare_types! {
    pub class JsReader for HashReader {
        init(_cx) {
            unimplemented!();
        }

        method fill(_cx) {
            unimplemented!();
        }

        method set_position(_cx) {
            unimplemented!();
        }
    }
}

register_module!(mut m, {
    m.export_function("hash", hash)?;
    m.export_class::<JsHash>("Hasher")?;
    Ok(())
});
