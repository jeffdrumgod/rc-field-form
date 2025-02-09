import React from 'react';
import type { FormInstance } from '../src';
import { render, act, waitFor, renderHook, fireEvent } from './test-utils';

import Form, { Field } from '../src';
import timeout from './common/timeout';
import InfoField, { Input } from './common/InfoField';
import { changeValue, matchError, getField } from './common';
import { vi } from 'vitest';

describe('Form.Dependencies', () => {
  it('touched', async () => {
    const form = React.createRef<FormInstance>();

    const { container } = render(
      <div>
        <Form ref={form}>
          <InfoField name="field_1" />
          <InfoField name="field_2" rules={[{ required: true }]} dependencies={['field_1']} />
        </Form>
      </div>,
    );

    // Not trigger if not touched
    await act(async () => {
      await changeValue(getField(container, 0), '');
    });
    matchError(getField(container, 1).parentElement, false);

    await act(async () => {
      form.current?.setFields([{ name: 'field_2', touched: true }]);
    });
    // Trigger if touched
    await act(async () => {
      await changeValue(getField(container, 1), '');
    });
    matchError(getField(container, 1).parentElement, true);
  });

  describe('initialValue', () => {
    function test(name: string, formProps = {}, fieldProps = {}) {
      it(name, async () => {
        let validated = false;

        const { container } = render(
          <div>
            <Form {...formProps}>
              <InfoField name="field_1" />
              <InfoField
                name="field_2"
                rules={[
                  {
                    validator: async () => {
                      validated = true;
                    },
                  },
                ]}
                dependencies={['field_1']}
                {...fieldProps}
              />
            </Form>
          </div>,
        );

        // Not trigger if not touched
        await act(async () => {
          await changeValue(getField(container, 0), '');
        });
        expect(validated).toBeTruthy();
      });
    }

    test('form level', { initialValues: { field_2: 'bamboo' } });
    test('field level', null, { initialValue: 'little' });
  });

  it('nest dependencies', async () => {
    const form = React.createRef<FormInstance>();
    let rendered = false;

    const { container } = render(
      <div>
        <Form ref={form}>
          <Field name="field_1">
            <Input />
          </Field>
          <Field name="field_2" dependencies={['field_1']}>
            <Input />
          </Field>
          <Field name="field_3" dependencies={['field_2']}>
            {control => {
              rendered = true;
              return <Input {...control} />;
            }}
          </Field>
        </Form>
      </div>,
    );

    await act(async () => {
      form.current?.setFields([
        { name: 'field_1', touched: true },
        { name: 'field_2', touched: true },
        { name: 'field_3', touched: true },
      ]);
    });

    rendered = false;
    await act(async () => {
      await changeValue(getField(container), '1');
    });

    expect(rendered).toBeTruthy();
  });

  it('should work when field is dirty', async () => {
    const Component = ({ pass = false }) => (
      <Form>
        <InfoField
          name="field_1"
          rules={[
            {
              validator: () => {
                if (pass) {
                  return Promise.resolve();
                }
                return Promise.reject('You should not pass');
              },
            },
          ]}
          dependencies={['field_2']}
        />

        <InfoField name="field_2" />

        <Field shouldUpdate>
          {(_, __, { resetFields }) => (
            <button
              type="button"
              onClick={() => {
                resetFields();
              }}
            />
          )}
        </Field>
      </Form>
    );
    const { container, rerender } = render(<Component pass={false} />);

    await act(async () => {
      fireEvent.submit(container.querySelector('form'));
      await timeout();
    });

    matchError(getField(container, 0).parentElement, 'You should not pass');

    // Mock new validate
    rerender(<Component pass={true} />);
    await act(async () => {
      await changeValue(getField(container, 1), 'bamboo');
    });

    matchError(getField(container, 0).parentElement, false);

    // Should not validate after reset
    rerender(<Component pass={false} />);

    await act(async () => {
      fireEvent.click(container.querySelector('button'));
      await changeValue(getField(container, 1), 'light');
      await timeout();
    });

    matchError(getField(container, 0).parentElement, false);
  });

  it('should work as a shortcut when name is not provided', async () => {
    const spy = vi.fn();
    const { container } = render(
      <Form>
        <Field dependencies={['field_1']}>
          {() => {
            spy();
            return 'gogogo';
          }}
        </Field>
        <Field name="field_1">
          <Input />
        </Field>
        <Field name="field_2">
          <Input />
        </Field>
      </Form>,
    );
    expect(spy).toHaveBeenCalledTimes(1);

    await act(async () => {
      await changeValue(getField(container, 'field_2'), 'value2');
    });
    // sync start
    //   valueUpdate -> not rerender
    //   depsUpdate  -> not rerender
    // sync end
    // async start
    //   validateFinish -> not rerender
    // async end
    expect(spy).toHaveBeenCalledTimes(1);
    await act(async () => {
      await changeValue(getField(container, 'field_1'), 'value1');
    });
    // sync start
    //   valueUpdate -> not rerender
    //   depsUpdate  -> rerender by deps
    //   [ react rerender once -> 2 ]
    // sync end
    // async start
    //   validateFinish -> not rerender
    // async end
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("shouldn't work when shouldUpdate is set", async () => {
    const spy = vi.fn();
    const { container } = render(
      <Form>
        <Field dependencies={['field_2']} shouldUpdate={() => true}>
          {() => {
            spy();
            return 'gogogo';
          }}
        </Field>
        <Field name="field_1">
          <Input />
        </Field>
        <Field name="field_2">
          <Input />
        </Field>
      </Form>,
    );
    expect(spy).toHaveBeenCalledTimes(1);
    await act(async () => {
      await changeValue(getField(container, 'field_1'), 'value1');
    });
    // sync start
    //   valueUpdate -> rerender by shouldUpdate
    //   depsUpdate  -> rerender by deps
    //   [ react rerender once -> 2 ]
    // sync end
    expect(spy).toHaveBeenCalledTimes(2);

    await act(async () => {
      await changeValue(getField(container, 'field_2'), 'value2');
    });
    // sync start
    //   valueUpdate -> rerender by shouldUpdate
    //   depsUpdate  -> rerender by deps
    //   [ react rerender once -> 3 ]
    // sync end
    expect(spy).toHaveBeenCalledTimes(3);
  });
});
