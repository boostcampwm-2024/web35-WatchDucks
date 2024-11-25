import { LineChart } from '@chart/LineChart';
import DataLayout from '@component/template/DataLayout';
import { DAY_TO_MS_SECOND } from '@constant/Time';
import useTop5Traffic from '@hook/api/useTop5Traffic';
import { Top5Traffic } from '@type/api';
import { fillEmptySlots } from '@util/Time';
import { useMemo } from 'react';

type Props = {
  generation: string;
};

export default function MainTrafficChart({ generation }: Props) {
  const { data } = useTop5Traffic(generation);

  const series = useMemo(() => {
    return data.map((item: Top5Traffic) => ({
      name: item.name || 'Unknown',
      data: fillEmptySlots(
        item.traffic.reduce<Array<[string, string]>>((acc, value, index, arr) => {
          if (index % 2 === 0 && index + 1 < arr.length) {
            acc.push([value, arr[index + 1]]);
          }
          return acc;
        }, [])
      ).map(([timestamp, value]) => ({
        x: new Date(timestamp),
        y: value
      }))
    }));
  }, [data]);

  const options: ApexCharts.ApexOptions = {
    chart: {
      events: {
        beforeZoom: (ctx, { xaxis }) => {
          const timeRange = xaxis.max - xaxis.min;
          const ONE_DAY = DAY_TO_MS_SECOND;
          if (timeRange > ONE_DAY) {
            return {
              xaxis: {
                min: ctx.w.globals.minX,
                max: ctx.w.globals.maxX
              }
            };
          }

          return {
            xaxis: {
              min: xaxis.min,
              max: xaxis.max
            }
          };
        }
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: '#64748B',
          fontSize: '12px'
        },
        datetimeFormatter: {
          hour: 'HH:mm'
        }
      },
      tickAmount: 24,
      tooltip: {
        formatter: (val: string) => {
          return new Date(val).toLocaleTimeString();
        }
      }
    },
    yaxis: {
      title: {
        text: 'Traffic Count',
        style: {
          color: '#64748B'
        }
      },
      min: 0
    }
  };

  return (
    <DataLayout cssOption='flex flex-col p-8 rounded-lg shadow-md w-full h-full'>
      <div className='m-16'>
        <h2 className='text-navy text-center text-2xl font-bold'>TOP5 DAILY TRAFFIC</h2>
      </div>
      <div className='w-full flex-1'>
        <LineChart options={options} series={series} />
      </div>
    </DataLayout>
  );
}
